from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import numpy as np
import json

app = FastAPI()

# Enable CORS for POST from any origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok"}

@app.options("/api/latency")
async def options_handler():
    return Response(status_code=200)

TELEMETRY_DATA = json.loads("""
[
  {
    "region": "apac",
    "service": "checkout",
    "latency_ms": 130.89,
    "uptime_pct": 97.652,
    "timestamp": 20250301
  },
  {
    "region": "apac",
    "service": "catalog",
    "latency_ms": 118.74,
    "uptime_pct": 97.541,
    "timestamp": 20250302
  },
  {
    "region": "apac",
    "service": "checkout",
    "latency_ms": 189.43,
    "uptime_pct": 99.376,
    "timestamp": 20250303
  },
  {
    "region": "apac",
    "service": "support",
    "latency_ms": 202.61,
    "uptime_pct": 98.818,
    "timestamp": 20250304
  },
  {
    "region": "apac",
    "service": "catalog",
    "latency_ms": 153.04,
    "uptime_pct": 98.781,
    "timestamp": 20250305
  },
  {
    "region": "apac",
    "service": "payments",
    "latency_ms": 194.43,
    "uptime_pct": 98.981,
    "timestamp": 20250306
  },
  {
    "region": "apac",
    "service": "recommendations",
    "latency_ms": 190.46,
    "uptime_pct": 97.273,
    "timestamp": 20250307
  },
  {
    "region": "apac",
    "service": "support",
    "latency_ms": 177.32,
    "uptime_pct": 97.79,
    "timestamp": 20250308
  },
  {
    "region": "apac",
    "service": "checkout",
    "latency_ms": 136.74,
    "uptime_pct": 98.635,
    "timestamp": 20250309
  },
  {
    "region": "apac",
    "service": "recommendations",
    "latency_ms": 137.89,
    "uptime_pct": 99.226,
    "timestamp": 20250310
  },
  {
    "region": "apac",
    "service": "checkout",
    "latency_ms": 219.63,
    "uptime_pct": 97.662,
    "timestamp": 20250311
  },
  {
    "region": "apac",
    "service": "payments",
    "latency_ms": 206.58,
    "uptime_pct": 97.225,
    "timestamp": 20250312
  },
  {
    "region": "emea",
    "service": "analytics",
    "latency_ms": 144.3,
    "uptime_pct": 97.142,
    "timestamp": 20250301
  },
  {
    "region": "emea",
    "service": "recommendations",
    "latency_ms": 158.61,
    "uptime_pct": 98.296,
    "timestamp": 20250302
  },
  {
    "region": "emea",
    "service": "recommendations",
    "latency_ms": 125.79,
    "uptime_pct": 99.166,
    "timestamp": 20250303
  },
  {
    "region": "emea",
    "service": "analytics",
    "latency_ms": 122.64,
    "uptime_pct": 97.936,
    "timestamp": 20250304
  },
  {
    "region": "emea",
    "service": "support",
    "latency_ms": 157.77,
    "uptime_pct": 98.353,
    "timestamp": 20250305
  },
  {
    "region": "emea",
    "service": "analytics",
    "latency_ms": 111.34,
    "uptime_pct": 98.888,
    "timestamp": 20250306
  },
  {
    "region": "emea",
    "service": "recommendations",
    "latency_ms": 136.02,
    "uptime_pct": 98.763,
    "timestamp": 20250307
  },
  {
    "region": "emea",
    "service": "recommendations",
    "latency_ms": 161.94,
    "uptime_pct": 97.433,
    "timestamp": 20250308
  },
  {
    "region": "emea",
    "service": "catalog",
    "latency_ms": 186.26,
    "uptime_pct": 97.631,
    "timestamp": 20250309
  },
  {
    "region": "emea",
    "service": "analytics",
    "latency_ms": 202.73,
    "uptime_pct": 98.603,
    "timestamp": 20250310
  },
  {
    "region": "emea",
    "service": "analytics",
    "latency_ms": 141.42,
    "uptime_pct": 97.513,
    "timestamp": 20250311
  },
  {
    "region": "emea",
    "service": "analytics",
    "latency_ms": 203.96,
    "uptime_pct": 98.947,
    "timestamp": 20250312
  },
  {
    "region": "amer",
    "service": "recommendations",
    "latency_ms": 112.31,
    "uptime_pct": 97.755,
    "timestamp": 20250301
  },
  {
    "region": "amer",
    "service": "recommendations",
    "latency_ms": 113.22,
    "uptime_pct": 97.178,
    "timestamp": 20250302
  },
  {
    "region": "amer",
    "service": "analytics",
    "latency_ms": 102.8,
    "uptime_pct": 97.47,
    "timestamp": 20250303
  },
  {
    "region": "amer",
    "service": "recommendations",
    "latency_ms": 174.08,
    "uptime_pct": 99.113,
    "timestamp": 20250304
  },
  {
    "region": "amer",
    "service": "checkout",
    "latency_ms": 175.53,
    "uptime_pct": 99.358,
    "timestamp": 20250305
  },
  {
    "region": "amer",
    "service": "analytics",
    "latency_ms": 176.17,
    "uptime_pct": 97.949,
    "timestamp": 20250306
  },
  {
    "region": "amer",
    "service": "catalog",
    "latency_ms": 174.01,
    "uptime_pct": 97.62,
    "timestamp": 20250307
  },
  {
    "region": "amer",
    "service": "recommendations",
    "latency_ms": 151.85,
    "uptime_pct": 97.485,
    "timestamp": 20250308
  },
  {
    "region": "amer",
    "service": "support",
    "latency_ms": 191.8,
    "uptime_pct": 97.282,
    "timestamp": 20250309
  },
  {
    "region": "amer",
    "service": "catalog",
    "latency_ms": 228.77,
    "uptime_pct": 99.18,
    "timestamp": 20250310
  },
  {
    "region": "amer",
    "service": "checkout",
    "latency_ms": 217.9,
    "uptime_pct": 98.752,
    "timestamp": 20250311
  },
  {
    "region": "amer",
    "service": "support",
    "latency_ms": 198.64,
    "uptime_pct": 98.375,
    "timestamp": 20250312
  }
]
""")

@app.post("/api/latency")
async def latency_analytics(request: Request):
    body = await request.json()
    regions = body.get("regions", [])
    threshold_ms = body.get("threshold_ms", 180)

    results = []
    for region in regions:
        records   = [r for r in TELEMETRY_DATA if r["region"] == region]
        latencies = [r["latency_ms"] for r in records]
        uptimes   = [r["uptime_pct"]  for r in records]
        results.append({
            "region":      region,
            "avg_latency": round(float(np.mean(latencies)), 2),
            "p95_latency": round(float(np.percentile(latencies, 95)), 2),
            "avg_uptime":  round(float(np.mean(uptimes)), 3),
            "breaches":    int(sum(1 for l in latencies if l > threshold_ms))
        })

    return {"regions": results}
