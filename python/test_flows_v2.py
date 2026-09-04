import os
import subprocess
import json
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise RuntimeError("OPENROUTER_API_KEY not found in .env")

os.environ["OPENROUTER_API_KEY"] = OPENROUTER_API_KEY

TESTS = [
    {
        "name": "http_callout",
        "prompt": "Create a screen flow that performs an HTTP callout named GetRandomQuote.Get Random Quote and displays the response in a screen called Random User Details with showFooter and allowBack. The flow transaction model is CurrentTransaction.",
        "reference": "flows-xml/HTTP_Callout_Flow.flow-meta.xml",
        "version": "67.0",
        "status": "Active"
    },
    {
        "name": "dynamic_choice",
        "prompt": "Create a screen flow for an Employee Leave Request. Add a dynamic choice set called LeaveTypeChoices pulling from Leave_Type__c on Leave_Request__c. Include 2 screens and a CreateRecords node to create the leave request.",
        "reference": "flows-xml/Employee_Leave_Request_Flow.flow-meta.xml",
        "version": "67.0",
        "status": "Active"
    }
]

report = {"tests": [], "passed": 0, "fixes": [], "unsupported": []}

for test in TESTS:
    print(f"\nRunning test: {test['name']}")
    
    # 1. Generate Graph
    graph_path = f"graphs/{test['name']}.json"
    cmd = ["python", "python/prompt_to_graph.py", test['prompt'], "--output", graph_path]
    subprocess.run(cmd, capture_output=True, text=True)
    
    # 2. Convert to XML
    xml_path = f"flows/{test['name']}.flow-meta.xml"
    os.makedirs("flows", exist_ok=True)
    cmd2 = ["python", "python/graph_to_flow_xml.py", graph_path, xml_path, "--api-version", test['version'], "--status", test['status']]
    subprocess.run(cmd2, capture_output=True, text=True)
    
    # 3. Compare with reference semantically
    cmd3 = ["python", "python/flow_validator.py", test['reference'], xml_path]
    res3 = subprocess.run(cmd3, capture_output=True, text=True)
    
    try:
        val_report = json.loads(res3.stdout)
        print(f"Score: {val_report['score']:.2f}%")
        print(f"Passed: {val_report['passed']}")
    except json.JSONDecodeError:
        pass

