#!/usr/bin/env python3
"""
LangGraph Recommendation Workflow
"""

import json
import sys
import os
from typing import Dict, List, Any, Optional, TypedDict, Literal
from langgraph.graph import StateGraph, END
from langgraph.graph.state import CompiledStateGraph
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_community.llms import LlamaCpp
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field

# ============================================================
# PYDANTIC MODELS
# ============================================================

class Recommendation(BaseModel):
    title: str = Field(description="Clear recommendation title")
    priority: Literal["high", "medium", "low"] = Field(description="Priority level")
    risk_addressed: str = Field(description="Which risk this addresses")
    reasoning: str = Field(description="Why this recommendation")
    action: str = Field(description="Specific action steps")
    expected_impact: str = Field(description="Expected outcome")

class ImprovementSuggestion(BaseModel):
    title: str = Field(description="Improvement title")
    reasoning: str = Field(description="Why this improvement")
    action: str = Field(description="Action steps")
    expected_impact: str = Field(description="Expected outcome")

class RecommendationResponse(BaseModel):
    summary: str = Field(description="Strategic overview")
    recommendations: List[Recommendation] = Field(description="List of recommendations")
    improvement_suggestions: List[ImprovementSuggestion] = Field(description="Improvement suggestions")

# ============================================================
# STATE DEFINITION
# ============================================================

class RecommendationState(TypedDict):
    project_context: Dict[str, Any]
    recommendations: Optional[RecommendationResponse]
    validation_result: Dict[str, Any]
    refinement_attempt: int
    llm_provider: Literal["local", "gemini"]
    final: bool
    error: Optional[str]
    raw_response: Optional[str]

# ============================================================
# LLM PROVIDER
# ============================================================

class LLMProvider:
    def __init__(self):
        self.local_llm = None
        self.gemini_llm = None

llm_provider = LLMProvider()

# ============================================================
# NODES
# ============================================================

def analysis_context_node(state: RecommendationState) -> dict:
    context = state.get('project_context', {})
    risks = context.get('all_risks', [])
    high_risks = [r for r in risks if r.get('priority') in ['HIGH', 'CRITICAL']]
    
    compact_context = {
        'project_summary': context.get('project_summary', {}),
        'high_priority_risks': high_risks,
        'all_risks': risks[:5],
        'swot': context.get('swot', {}),
        'prediction': context.get('prediction', {})
    }
    
    return {'project_context': compact_context, 'refinement_attempt': 0}

def recommendation_generator_node(state: RecommendationState) -> dict:
    context = state['project_context']
    prompt = build_recommendation_prompt(context)
    
    # Fallback recommendations
    recommendations = generate_fallback_recommendations(context)
    
    return {
        'recommendations': recommendations,
        'error': None
    }

def recommendation_validator_node(state: RecommendationState) -> dict:
    recommendations = state.get('recommendations')
    issues = []
    
    if not recommendations:
        issues.append('No recommendations generated')
        return {'validation_result': {'valid': False, 'issues': issues}}
    
    if not recommendations.summary:
        issues.append('Missing summary')
    
    recs = recommendations.recommendations
    if not recs or len(recs) == 0:
        issues.append('No recommendations provided')
    
    return {'validation_result': {'valid': len(issues) == 0, 'issues': issues}}

def refine_recommendation_node(state: RecommendationState) -> dict:
    return {}  # Simple fallback

def finalize_node(state: RecommendationState) -> dict:
    recommendations = state.get('recommendations')
    if not recommendations:
        recommendations = generate_fallback_recommendations(state.get('project_context', {}))
    return {'final': True, 'recommendations': recommendations}

# ============================================================
# CONDITIONAL LOGIC
# ============================================================

def should_refine(state: RecommendationState) -> Literal["refine", "final"]:
    if state.get('refinement_attempt', 0) >= 1:
        return 'final'
    validation = state.get('validation_result', {})
    if validation.get('valid', False):
        return 'final'
    return 'final'  # Just go to final

# ============================================================
# PROMPT BUILDERS
# ============================================================

def build_recommendation_prompt(context: Dict) -> str:
    summary = context.get('project_summary', {})
    high_risks = context.get('high_priority_risks', [])
    
    return f"""
You are Senken, a strategic business advisor.

PROJECT SUMMARY:
- Name: {summary.get('name', 'N/A')}
- Industry: {summary.get('industry', 'N/A')}

Generate strategic recommendations. Return as JSON.
"""

def build_refinement_prompt(context: Dict, previous) -> str:
    return build_recommendation_prompt(context)

# ============================================================
# FALLBACK RECOMMENDATIONS
# ============================================================

def generate_fallback_recommendations(context: Dict) -> RecommendationResponse:
    return RecommendationResponse(
        summary="Based on the project analysis, the following strategic recommendations are suggested.",
        recommendations=[
            Recommendation(
                title="Develop a Comprehensive Risk Management Plan",
                priority="high",
                risk_addressed="Overall Risk",
                reasoning="Structured risk management is essential for project success.",
                action="Create a risk register, assign owners, and establish monitoring mechanisms.",
                expected_impact="Reduces overall project risk"
            ),
            Recommendation(
                title="Secure Additional Funding Sources",
                priority="high",
                risk_addressed="Financial Risk",
                reasoning="Financial stability is critical for project sustainability.",
                action="Explore grants, investor networks, and strategic partnerships.",
                expected_impact="Provides financial buffer"
            ),
            Recommendation(
                title="Build Strategic Partnerships",
                priority="medium",
                risk_addressed="Market Risk",
                reasoning="Partnerships can accelerate market entry and reduce risks.",
                action="Identify and engage potential partners in the industry.",
                expected_impact="Accelerates market validation"
            )
        ],
        improvement_suggestions=[
            ImprovementSuggestion(
                title="Enhance Team Capabilities",
                reasoning="Additional expertise can improve execution.",
                action="Hire key roles or engage experienced advisors.",
                expected_impact="Improves execution capability"
            )
        ]
    )

# ============================================================
# BUILD THE GRAPH
# ============================================================

def build_recommendation_graph() -> CompiledStateGraph:
    graph = StateGraph(RecommendationState)
    
    graph.add_node("analysis_context", analysis_context_node)
    graph.add_node("recommendation_generator", recommendation_generator_node)
    graph.add_node("recommendation_validator", recommendation_validator_node)
    graph.add_node("refine_recommendation", refine_recommendation_node)
    graph.add_node("finalize", finalize_node)
    
    graph.set_entry_point("analysis_context")
    graph.add_edge("analysis_context", "recommendation_generator")
    graph.add_edge("recommendation_generator", "recommendation_validator")
    graph.add_conditional_edges(
        "recommendation_validator",
        should_refine,
        {"refine": "refine_recommendation", "final": "finalize"}
    )
    graph.add_edge("refine_recommendation", "recommendation_validator")
    graph.add_edge("finalize", END)
    
    return graph.compile()