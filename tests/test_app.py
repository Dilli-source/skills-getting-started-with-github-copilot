import copy
import pytest
from fastapi.testclient import TestClient

import src.app as appmod


initial_activities = {
    "Chess Club": {
        "description": "Learn strategies and compete in chess tournaments",
        "schedule": "Fridays, 3:30 PM - 5:00 PM",
        "max_participants": 12,
        "participants": ["michael@mergington.edu", "daniel@mergington.edu"],
    },
    "Programming Class": {
        "description": "Learn programming fundamentals and build software projects",
        "schedule": "Tuesdays and Thursdays, 3:30 PM - 4:30 PM",
        "max_participants": 20,
        "participants": ["emma@mergington.edu", "sophia@mergington.edu"],
    },
    "Gym Class": {
        "description": "Physical education and sports activities",
        "schedule": "Mondays, Wednesdays, Fridays, 2:00 PM - 3:00 PM",
        "max_participants": 30,
        "participants": ["john@mergington.edu", "olivia@mergington.edu"],
    },
    "Basketball Team": {
        "description": "Competitive basketball training and matches",
        "schedule": "Mondays and Thursdays, 4:00 PM - 5:30 PM",
        "max_participants": 15,
        "participants": ["james@mergington.edu"],
    },
    "Tennis Club": {
        "description": "Learn tennis skills and participate in tournaments",
        "schedule": "Wednesdays and Saturdays, 3:00 PM - 4:30 PM",
        "max_participants": 10,
        "participants": ["lucas@mergington.edu", "grace@mergington.edu"],
    },
    "Drama Club": {
        "description": "Perform in theatrical productions and stage plays",
        "schedule": "Tuesdays, 4:00 PM - 5:30 PM",
        "max_participants": 25,
        "participants": ["isabella@mergington.edu"],
    },
    "Art Studio": {
        "description": "Explore painting, drawing, and sculpture techniques",
        "schedule": "Wednesdays, 3:30 PM - 5:00 PM",
        "max_participants": 18,
        "participants": ["chloe@mergington.edu", "noah@mergington.edu"],
    },
    "Debate Team": {
        "description": "Develop public speaking and argumentation skills",
        "schedule": "Thursdays, 4:00 PM - 5:00 PM",
        "max_participants": 16,
        "participants": ["alexander@mergington.edu"],
    },
    "Science Club": {
        "description": "Conduct experiments and explore scientific concepts",
        "schedule": "Fridays, 4:00 PM - 5:30 PM",
        "max_participants": 20,
        "participants": ["mia@mergington.edu", "liam@mergington.edu"],
    },
}


@pytest.fixture(autouse=True)
def reset_activities():
    # Reset the in-memory activities before each test
    appmod.activities = copy.deepcopy(initial_activities)
    yield


def test_get_activities():
    client = TestClient(appmod.app)
    r = client.get("/activities")
    assert r.status_code == 200
    data = r.json()
    assert "Chess Club" in data
    assert isinstance(data["Chess Club"]["participants"], list)


def test_signup_and_unregister_flow():
    client = TestClient(appmod.app)
    activity = "Chess Club"
    email = "teststudent@mergington.edu"

    # signup
    r = client.post(f"/activities/{activity}/signup?email={email}")
    assert r.status_code == 200
    assert email in appmod.activities[activity]["participants"]

    # duplicate signup should fail
    r2 = client.post(f"/activities/{activity}/signup?email={email}")
    assert r2.status_code == 400

    # unregister
    r3 = client.post(f"/activities/{activity}/unregister?email={email}")
    assert r3.status_code == 200
    assert email not in appmod.activities[activity]["participants"]


def test_unregister_nonexistent_returns_404():
    client = TestClient(appmod.app)
    activity = "Chess Club"
    email = "noone@mergington.edu"
    r = client.post(f"/activities/{activity}/unregister?email={email}")
    assert r.status_code == 404
