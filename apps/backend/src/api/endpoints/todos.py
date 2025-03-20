from typing import List, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

router = APIRouter()


class TodoItem(BaseModel):
    id: Optional[int] = None
    title: str
    completed: bool = False


# In-memory store for demo purposes
todos_db = [
    TodoItem(id=1, title="Learn FastAPI", completed=True),
    TodoItem(id=2, title="Build monorepo app", completed=False),
]


@router.get("/", response_model=List[TodoItem])
async def get_todos():
    """Get all todos."""
    return todos_db


@router.post("/", response_model=TodoItem, status_code=status.HTTP_201_CREATED)
async def create_todo(todo: TodoItem):
    """Create a new todo."""
    # Simple ID assignment for demo purposes
    todo.id = max([t.id for t in todos_db], default=0) + 1
    todos_db.append(todo)
    return todo


@router.get("/{todo_id}", response_model=TodoItem)
async def get_todo(todo_id: int):
    """Get a specific todo by ID."""
    for todo in todos_db:
        if todo.id == todo_id:
            return todo
    raise HTTPException(status_code=404, detail="Todo not found")
