"""
Full-Stack SaaS Crew - 7-Agent Team for Building Complete Applications
Optimized for hackathon demo with clear roles and focused outputs.
"""
from __future__ import annotations

from typing import Dict, List

from crewai import Agent, Crew, Process, Task

from app.crewai.adapters import recall_memory
from app.crewai.models import get_llm_for_agent


def make_fullstack_saas_crew(crew_id: str, user_mission: str, tools: Dict[str, List]) -> Crew:
    """
    Create the Full-Stack SaaS Crew optimized for complete application development.
    
    This crew builds complete SaaS applications with:
    - Full-stack architecture planning
    - Backend API implementation
    - Frontend UI development
    - Comprehensive testing
    - DevOps configuration
    - Security considerations
    
    Args:
        crew_id: Unique identifier for the crew
        user_mission: User's mission description (e.g., "Build a subscription management SaaS")
        tools: Dictionary of tools available to each agent role
    
    Returns:
        Configured CrewAI Crew instance
    """
    
    # Retrieve relevant memories for context
    memory_context = _get_memory_context(crew_id, user_mission)
    
    # === ORCHESTRATOR ===
    orchestrator = Agent(
        role="Orchestrator / Tech Lead",
        goal=(
            "Break down the user mission into clear, actionable tasks. "
            "Coordinate between specialists. Ensure coherent final deliverable. "
            "Use Qdrant memory to maintain context across iterations."
        ),
        backstory=(
            "You are the technical leader of a 7-person engineering team. "
            "Your job is strategic planning, task delegation, and integration. "
            "You have deep knowledge of full-stack architecture patterns and can "
            "make quick, pragmatic decisions for MVP development. "
            "You store and recall important context using vector memory."
        ),
        tools=tools.get("orchestrator", []),
        llm=get_llm_for_agent("Orchestrator"),
        cache=False,
        allow_delegation=False,
        verbose=True,
    )
    
    # === BACKEND TEAM ===
    backend_architect = Agent(
        role="Backend Architect",
        goal=(
            "Design the backend architecture including API endpoints, "
            "data models, authentication strategy, and service boundaries."
        ),
        backstory=(
            "You are an experienced backend architect who designs scalable APIs. "
            "You think about data flow, authentication, authorization, error handling, "
            "and API contracts. You create clear specifications for implementers."
        ),
        tools=tools.get("backend", []),
        llm=get_llm_for_agent("Backend Architect"),
        cache=False,
        allow_delegation=False,
        verbose=True,
    )
    
    backend_implementer = Agent(
        role="Backend Implementer",
        goal=(
            "Implement FastAPI endpoints, database models, business logic, "
            "and data validation based on the architect's design."
        ),
        backstory=(
            "You are a skilled backend developer who writes clean, maintainable code. "
            "You implement APIs following REST/GraphQL best practices, handle errors "
            "gracefully, and write clear documentation. You use FastAPI, SQLAlchemy, "
            "and Pydantic for type safety."
        ),
        tools=tools.get("backend", []),
        llm=get_llm_for_agent("Backend Implementer"),
        cache=False,
        allow_delegation=False,
        verbose=True,
    )
    
    # === FRONTEND TEAM ===
    frontend_architect = Agent(
        role="Frontend Architect",
        goal=(
            "Design the UI/UX structure, component hierarchy, state management, "
            "and navigation flow for the SaaS application."
        ),
        backstory=(
            "You are a frontend architect who designs intuitive, accessible interfaces. "
            "You think about component composition, state flow, routing, forms, and "
            "user feedback. You create wireframes and component specifications."
        ),
        tools=tools.get("frontend", []),
        llm=get_llm_for_agent("Frontend Architect"),
        cache=False,
        allow_delegation=False,
        verbose=True,
    )
    
    frontend_implementer = Agent(
        role="Frontend Implementer",
        goal=(
            "Build React components, wire up API calls, implement forms and "
            "validation, and apply styling based on the architect's design."
        ),
        backstory=(
            "You are a frontend developer who builds modern React applications. "
            "You use TypeScript, React hooks, and CSS/TailwindCSS. You create "
            "responsive, accessible components with proper error handling and loading states."
        ),
        tools=tools.get("frontend", []),
        llm=get_llm_for_agent("Frontend Implementer"),
        cache=False,
        allow_delegation=False,
        verbose=True,
    )
    
    # === QA ENGINEER ===
    qa_engineer = Agent(
        role="QA / Test Engineer",
        goal=(
            "Design test strategies, write unit and integration tests, "
            "identify edge cases, and ensure quality across backend and frontend."
        ),
        backstory=(
            "You are a quality assurance engineer who ensures software reliability. "
            "You write pytest tests for backend APIs, React Testing Library tests "
            "for components, and document test plans. You think about edge cases, "
            "error scenarios, and user acceptance criteria."
        ),
        tools=tools.get("qa", []),
        llm=get_llm_for_agent("QA Engineer"),
        cache=False,
        allow_delegation=False,
        verbose=True,
    )
    
    # === DEVOPS ENGINEER ===
    devops_engineer = Agent(
        role="DevOps / Infrastructure Engineer",
        goal=(
            "Create Docker configuration, CI/CD pipelines, environment setup, "
            "and deployment instructions for local dev and production."
        ),
        backstory=(
            "You are a DevOps engineer who automates everything. You create "
            "Dockerfiles, docker-compose files, CI/CD workflows (GitHub Actions), "
            "and deployment guides. You think about secrets management, resource "
            "limits, health checks, and monitoring."
        ),
        tools=tools.get("devops", []),
        llm=get_llm_for_agent("DevOps Engineer"),
        cache=False,
        allow_delegation=False,
        verbose=True,
    )
    
    # === TASK DEFINITIONS ===
    
    # Task 1: Planning (Orchestrator)
    task_plan = Task(
        description=(
            f"Mission: {user_mission}\n\n"
            f"{memory_context}\n\n"
            "Create a detailed execution plan with:\n"
            "1. High-level architecture overview\n"
            "2. Key features to implement (prioritized)\n"
            "3. Task assignments for each specialist\n"
            "4. Success criteria and acceptance tests\n"
            "5. Timeline estimate\n\n"
            "Keep it focused on MVP scope - ship fast, iterate later."
        ),
        agent=orchestrator,
        expected_output=(
            "A numbered execution plan with:\n"
            "- Architecture diagram (ASCII or description)\n"
            "- Feature list with priorities\n"
            "- Clear task assignments\n"
            "- Success criteria"
        ),
    )
    
    # Task 2: Backend Architecture
    task_backend_arch = Task(
        description=(
            "Design the backend architecture based on the execution plan. Include:\n"
            "1. API endpoints (list all routes with methods)\n"
            "2. Data models (database schemas)\n"
            "3. Authentication/authorization strategy\n"
            "4. Key business logic flows\n"
            "5. Error handling approach"
        ),
        agent=backend_architect,
        expected_output=(
            "Backend architecture document with:\n"
            "- API endpoint specifications\n"
            "- Database schema (SQLAlchemy models)\n"
            "- Auth flow diagram\n"
            "- Key algorithms/logic"
        ),
    )
    
    # Task 3: Backend Implementation
    task_backend_impl = Task(
        description=(
            "Implement the backend based on the architect's design:\n"
            "1. FastAPI route handlers\n"
            "2. SQLAlchemy database models\n"
            "3. Pydantic schemas for validation\n"
            "4. Business logic and helpers\n"
            "5. Error handling and logging"
        ),
        agent=backend_implementer,
        expected_output=(
            "Working backend code:\n"
            "- routes.py with all endpoints\n"
            "- models.py with database models\n"
            "- schemas.py with Pydantic schemas\n"
            "- Main app.py setup\n"
            "All code should be complete and runnable."
        ),
    )
    
    # Task 4: Frontend Architecture
    task_frontend_arch = Task(
        description=(
            "Design the frontend architecture based on the execution plan and backend API:\n"
            "1. Page structure and navigation\n"
            "2. Component hierarchy\n"
            "3. State management approach\n"
            "4. API integration patterns\n"
            "5. Form validation strategy"
        ),
        agent=frontend_architect,
        expected_output=(
            "Frontend architecture document with:\n"
            "- Component tree diagram\n"
            "- Page routing map\n"
            "- State management plan\n"
            "- API call patterns\n"
            "- UI/UX notes"
        ),
    )
    
    # Task 5: Frontend Implementation
    task_frontend_impl = Task(
        description=(
            "Build the frontend based on the architect's design:\n"
            "1. React components (pages + reusable components)\n"
            "2. API client functions\n"
            "3. Forms with validation\n"
            "4. Routing setup\n"
            "5. Styling (TailwindCSS or CSS)"
        ),
        agent=frontend_implementer,
        expected_output=(
            "Working frontend code:\n"
            "- App.tsx with routing\n"
            "- Page components\n"
            "- Shared components\n"
            "- api.ts with API calls\n"
            "- Styled, responsive UI\n"
            "All code should be complete and runnable."
        ),
    )
    
    # Task 6: Testing
    task_qa = Task(
        description=(
            "Create comprehensive tests for backend and frontend:\n"
            "1. Backend API tests (pytest)\n"
            "2. Frontend component tests (React Testing Library)\n"
            "3. Integration test scenarios\n"
            "4. Edge cases and error scenarios\n"
            "5. Test documentation"
        ),
        agent=qa_engineer,
        expected_output=(
            "Complete test suite:\n"
            "- test_api.py (backend tests)\n"
            "- component.test.tsx (frontend tests)\n"
            "- Test plan documentation\n"
            "- Edge cases covered\n"
            "All tests should be runnable."
        ),
    )
    
    # Task 7: DevOps
    task_devops = Task(
        description=(
            "Create deployment and development infrastructure:\n"
            "1. Dockerfile for backend\n"
            "2. docker-compose.yml for full stack\n"
            "3. .env.example with required variables\n"
            "4. GitHub Actions CI/CD (optional)\n"
            "5. README with setup instructions"
        ),
        agent=devops_engineer,
        expected_output=(
            "Complete DevOps setup:\n"
            "- Dockerfile\n"
            "- docker-compose.yml\n"
            "- .env.example\n"
            "- CI/CD workflow (if applicable)\n"
            "- Comprehensive README.md\n"
            "All configs should be production-ready."
        ),
    )
    
    # Task 8: Integration (Orchestrator)
    task_integrate = Task(
        description=(
            "Integrate all outputs into a final deliverable:\n"
            "1. Verify all components are complete\n"
            "2. Create file structure overview\n"
            "3. Write final project README\n"
            "4. List next steps and improvements\n"
            "5. Store key decisions in memory for future iterations"
        ),
        agent=orchestrator,
        expected_output=(
            "Final integrated deliverable with:\n"
            "- Complete project structure\n"
            "- All code files organized\n"
            "- Comprehensive README\n"
            "- Setup and deployment instructions\n"
            "- Next steps roadmap\n"
            "Ready for demo and deployment."
        ),
    )
    
    # === CREATE CREW ===
    return Crew(
        agents=[
            orchestrator,
            backend_architect,
            backend_implementer,
            frontend_architect,
            frontend_implementer,
            qa_engineer,
            devops_engineer,
        ],
        tasks=[
            task_plan,
            task_backend_arch,
            task_backend_impl,
            task_frontend_arch,
            task_frontend_impl,
            task_qa,
            task_devops,
            task_integrate,
        ],
        process=Process.sequential,
        verbose=True,
        memory=True,  # Enable CrewAI's built-in memory
    )


def _get_memory_context(crew_id: str, user_mission: str, k: int = 5) -> str:
    """Retrieve relevant memories from Qdrant for context."""
    try:
        hits = recall_memory(crew_id, user_mission, k=k)
        if not hits:
            return "No prior mission context found."
        
        rows = "\n".join(f"- {hit.page_content[:300]}" for hit in hits)
        return f"📝 Relevant Prior Context (from Qdrant):\n{rows}\n"
    except Exception as e:
        return f"⚠️ Could not retrieve memory: {e}"
