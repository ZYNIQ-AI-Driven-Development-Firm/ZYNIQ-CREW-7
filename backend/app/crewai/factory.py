from __future__ import annotations

from typing import Dict, List

from crewai import Agent, Crew, Process, Task

from app.crewai.adapters import llm_code, llm_general, recall_memory

SYSTEM_PREAMBLE = (
    "You are part of the 7-member Crew-7 team.\n"
    "Respect the Orchestrator's plan, be concise, cite assumptions, and propose next actions."
)


def make_agent(role: str, goal: str, tools: List | None, *, llm_kind: str = "general") -> Agent:
    llm = llm_code() if llm_kind == "code" else llm_general()
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
    orchestrator = make_agent(
        role="Orchestrator",
        goal="Plan the sequence of tasks, assign to specialists, integrate the final answer.",
        tools=tools.get("orchestrator"),
        llm_kind="general",
    )
    backend = make_agent("Backend Engineer", "Design scalable APIs and services.", tools.get("backend"), llm_kind="code")
    frontend = make_agent("Frontend Engineer", "Build responsive, accessible UI.", tools.get("frontend"), llm_kind="code")
    qa = make_agent("QA Engineer", "Design and run tests, report defects.", tools.get("qa"), llm_kind="general")
    devops = make_agent("DevOps", "Provision containers, CI/CD and IaC.", tools.get("devops"), llm_kind="general")
    data = make_agent("Data Engineer", "Design schemas, ETL, and analytics layers.", tools.get("data"), llm_kind="general")
    security = make_agent("Security Analyst", "Assess risks and propose mitigations.", tools.get("security"), llm_kind="general")

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
