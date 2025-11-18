from __future__ import annotations

from typing import Dict, List

from crewai import Agent, Crew, Process, Task

from app.crewai.adapters import recall_memory
from app.crewai.models import get_llm_for_agent

SYSTEM_PREAMBLE = (
    "You are part of the 7-member Crew-7 team.\n"
    "Respect the Orchestrator's plan, be concise, cite assumptions, and propose next actions."
)


def make_agent(role: str, goal: str, tools: List | None, *, use_code_model: bool = False) -> Agent:
    """
    Create a CrewAI agent with appropriate LLM based on role.
    
    Args:
        role: Agent role (e.g., "Orchestrator", "Backend Engineer")
        goal: Agent's goal/objective
        tools: List of tools available to the agent
        use_code_model: If True, prefer code-optimized models for specialists
    """
    llm = get_llm_for_agent(role)
    return Agent(
        role=role,
        goal=goal,
        backstory=SYSTEM_PREAMBLE,
        tools=tools or [],
        llm=llm,
        cache=False,
        allow_delegation=False,
        verbose=True,
    )


def memory_context(crew_id: str, user_prompt: str) -> str:
    hits = recall_memory(crew_id, user_prompt, k=5)
    if not hits:
        return ""
    rows = "\n".join(f"- {hit.page_content[:300]}" for hit in hits)
    return f"Relevant prior memory:\n{rows}\n"


def make_crew(crew_id: str, user_prompt: str, tools: Dict[str, List]) -> Crew:
    """
    Create a 7-agent CrewAI crew with Gemini Orchestrator and aimalapi specialists.
    """
    orchestrator = make_agent(
        role="Orchestrator / Tech Lead",
        goal="Plan the sequence of tasks, assign to specialists, integrate the final answer.",
        tools=tools.get("orchestrator"),
    )
    backend = make_agent(
        role="Backend Engineer", 
        goal="Design scalable APIs and services.", 
        tools=tools.get("backend"),
        use_code_model=True
    )
    frontend = make_agent(
        role="Frontend Engineer", 
        goal="Build responsive, accessible UI.", 
        tools=tools.get("frontend"),
        use_code_model=True
    )
    qa = make_agent(
        role="QA Engineer", 
        goal="Design and run tests, report defects.", 
        tools=tools.get("qa")
    )
    devops = make_agent(
        role="DevOps Engineer", 
        goal="Provision containers, CI/CD and IaC.", 
        tools=tools.get("devops")
    )
    data = make_agent(
        role="Data Engineer", 
        goal="Design schemas, ETL, and analytics layers.", 
        tools=tools.get("data")
    )
    security = make_agent(
        role="Security Analyst", 
        goal="Assess risks and propose mitigations.", 
        tools=tools.get("security")
    )

    context = memory_context(crew_id, user_prompt)

    t_plan = Task(
        description=f"Create a short execution plan for the prompt. Prompt:\n{user_prompt}\n{context}",
        agent=orchestrator,
        expected_output="A numbered plan assigning steps to roles with success criteria.",
    )
    t_backend = Task(
        description="Implement backend/API pieces from the plan; include endpoint specs and data models.",
        agent=backend,
        expected_output="Endpoints, models, and pseudocode or code stubs.",
    )
    t_frontend = Task(
        description="Propose UI states and component contracts; align with API.",
        agent=frontend,
        expected_output="Wireframe-level components + prop contracts.",
    )
    t_qa = Task(
        description="Derive acceptance tests from plan and specialist outputs.",
        agent=qa,
        expected_output="Test matrix and edge cases.",
    )
    t_devops = Task(
        description="Provide docker-compose or k8s notes; resource limits and secrets.",
        agent=devops,
        expected_output="Infra steps + YAML snippets.",
    )
    t_data = Task(
        description="Define DB schema, indexes, analytics tables.",
        agent=data,
        expected_output="DDL + data contracts.",
    )
    t_security = Task(
        description="List security risks, auth model, rate limiting, and mitigations.",
        agent=security,
        expected_output="Controls and checks.",
    )
    t_integrate = Task(
        description="Integrate all outputs into a single concise deliverable for the user.",
        agent=orchestrator,
        expected_output="Final integrated answer with bullets and next actions.",
    )

    return Crew(
        agents=[orchestrator, backend, frontend, qa, devops, data, security],
        tasks=[t_plan, t_backend, t_frontend, t_qa, t_devops, t_data, t_security, t_integrate],
        process=Process.sequential,
        verbose=True,
    )
