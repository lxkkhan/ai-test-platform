"""Simple webhook bridge → LangGraph orchestrator"""
from flask import Flask, request, jsonify
import httpx
app = Flask(__name__)

@app.route("/invoke", methods=["POST"])
def invoke():
    data = request.get_json(force=True, silent=True) or {}
    story_id = data.get("story_id", data.get("body", {}).get("story_id", ""))
    if not story_id:
        return jsonify({"error": "story_id required"}), 422
    r = httpx.post("http://orchestrator:8000/invoke?story_id=" + story_id + "&parallel=true&notify_on=always")
    return jsonify(r.json()), r.status_code

@app.route("/", methods=["GET"])
def index():
    return """<form method=POST action=/invoke>
story_id: <input name=story_id><button type=submit>执行测试</button></form>"""

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
