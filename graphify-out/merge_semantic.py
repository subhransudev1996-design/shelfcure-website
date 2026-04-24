import json
from pathlib import Path

merged = {
    'nodes': [],
    'edges': [],
    'hyperedges': [],
    'input_tokens': 0,
    'output_tokens': 0,
}
Path('graphify-out/.graphify_semantic.json').write_text(json.dumps(merged, indent=2), encoding='utf-8')
print("Semantic extraction skipped/emulated: 0 nodes, 0 edges")
