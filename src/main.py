# from fastapi import FastAPI
# from rdflib import Graph, Namespace
# from fastapi.middleware.cors import CORSMiddleware

# app = FastAPI()

# # Set up CORS middleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://127.0.0.1:3000"],  # Add other domains as needed
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Define RDF Namespace
# APP = Namespace("http://example.org/app/")

# # Load RDF data from TTL file
# g = Graph()
# g.parse("apps_and_files.ttl", format="turtle")




# @app.get("/apps")
# def list_apps():
#     query = """
#     SELECT DISTINCT ?app ?name WHERE {
#         ?app <http://example.org/app/hasName> ?name .
#     }
#     """
#     results = g.query(query)
#     apps = [{"id": str(row.app.split('/')[-1]), "name": str(row.name)} for row in results]
#     return {"apps": apps}

# @app.get("/search/{app_id}")
# async def search_app(app_id: str):
#     app_uri = APP[app_id]

#     # Nodes Query: Fetch details for the main app and its upstream
#     nodes_query = f"""
#     SELECT ?app ?name ?type ?upstream ?upstreamName ?upstreamType WHERE {{
#         ?app <http://example.org/app/hasName> ?name ;
#              <http://example.org/app/hasType> ?type .
#         OPTIONAL {{
#             ?app <http://example.org/app/hasUpstreamApp> ?upstream .
#             ?upstream <http://example.org/app/hasName> ?upstreamName ;
#                       <http://example.org/app/hasType> ?upstreamType .
#         }}
#         FILTER (?app = <{app_uri}>)
#     }}
#     """

#     # Edges Query: Direct from and to for the main app
#     edges_query = f"""
#     SELECT ?from ?to WHERE {{
#         ?from <http://example.org/app/hasUpstreamApp> ?to .
#         FILTER (?from = <{app_uri}>)
#     }}
#     """

#     # Groups Query: Identify groups based on types of app and upstream app
#     groups_query = f"""
#     SELECT DISTINCT ?apps ?type WHERE {{
#         {{
#             ?app <http://example.org/app/hasType> ?type
#             bind(?app as ?apps)
#         }}
#         UNION
#         {{
#             ?app <http://example.org/app/hasUpstreamApp> ?upstream .
#             bind(?upstream as ?apps)
#             ?upstream <http://example.org/app/hasType> ?type
#         }}
#         FILTER (?app = <{app_uri}>)
#     }}
#     """

#     nodes_results = g.query(nodes_query)
#     edges_results = g.query(edges_query)
#     groups_results = g.query(groups_query)

#     nodes = [{
#         "id": str(row.app),
#         "name": str(row.name),
#         "type": str(row.type),
#         "upstream": {
#             "id": str(row.upstream),
#             "name": str(row.upstreamName),
#             "type": str(row.upstreamType)
#         } if row.upstream else None
#     } for row in nodes_results]

#     edges = [{"from": str(row['from']), "to": str(row.to)} for row in edges_results]
    
#     groups = [{"id": str(row.apps), "type": str(row.type)} for row in groups_results]

#     return {"nodes": nodes, "edges": edges, "groups": groups}

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)


from fastapi import FastAPI
from rdflib import Graph, Namespace, URIRef
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

app = FastAPI()

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:3000"],  # Adjust the allowed origins as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define RDF Namespace
APP = Namespace("http://example.org/app/")

# Load RDF data from TTL file
g = Graph()
g.parse("apps_and_files.ttl", format="turtle")

class SPARQLQuery(BaseModel):
    nodesQuery: str
    edgesQuery: str
    groupsQuery: str

@app.post("/query")
async def process_sparql_query(queries: SPARQLQuery):
    # Explicitly bind namespace prefixes if needed
    g.bind("app", APP)

    # Process each SPARQL query and collect the results
    nodes_results = g.query(queries.nodesQuery)
    edges_results = g.query(queries.edgesQuery)
    groups_results = g.query(queries.groupsQuery)

    # Initialize containers for nodes, edges, and groups
    nodes = [{"id": str(row[0]), "label": str(row[1]), "type": str(row[2])} for row in nodes_results]
    edges = [{"source": str(row[0]), "target": str(row[1])} for row in edges_results]
    groups = [{"id": str(row[0]), "type": str(row[1])} for row in groups_results]

    print("Nodes:", nodes, "Edges:", edges, "Groups:", groups)  # Debug output

    # Return the processed data as JSON
    return {"nodes": nodes, "edges": edges, "groups": groups}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

