from flask import Flask, jsonify, request
from flask_cors import CORS
from dijkstra import Graph, AIRPORTS

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Load the graph once at startup
world = Graph.load()

@app.route('/api/airports', methods=['GET'])
def get_airports():
    """Return all available airports."""
    airports_list = [
        {
            'code': airport.code,
            'name': airport.name,
            'country': airport.country,
            'latitude': airport.latitude,
            'longitude': airport.longitude
        }
        for airport in AIRPORTS.values()
    ]
    return jsonify(airports_list)

@app.route('/api/route', methods=['POST'])
def find_route():
    """Find the cheapest route between two airports."""
    data = request.get_json()
    
    origin_code = data.get('origin')
    destination_code = data.get('destination')
    top_routes = data.get('top_routes', False)  # New parameter to get top routes
    
    if not origin_code or not destination_code:
        return jsonify({'error': 'Origin and destination are required'}), 400
    
    if origin_code not in AIRPORTS:
        return jsonify({'error': f'Unknown origin airport: {origin_code}'}), 404
    
    if destination_code not in AIRPORTS:
        return jsonify({'error': f'Unknown destination airport: {destination_code}'}), 404
    
    origin = AIRPORTS[origin_code]
    destination = AIRPORTS[destination_code]
    
    if top_routes:
        # Get top 5 cheapest routes
        result = world.find_top_routes(origin, destination, k=5)
        
        if not result:
            return jsonify({'error': 'No routes found'}), 404
        
        # Convert routes to serializable format
        routes_list = []
        for price, path in result:
            route = [
                {
                    'code': airport.code,
                    'name': airport.name,
                    'country': airport.country,
                    'latitude': airport.latitude,
                    'longitude': airport.longitude
                }
                for airport in path
            ]
            routes_list.append({
                'price': round(price, 2),
                'route': route
            })
        
        return jsonify({
            'top_routes': routes_list,
            'count': len(routes_list)
        })
    else:
        # Original behavior - just return the cheapest route
        result = world.dijkstra(origin, destination)
        
        if result == float('infinity'):
            return jsonify({'error': 'No route found'}), 404
        
        price, path = result
        
        # Convert path to serializable format
        route = [
            {
                'code': airport.code,
                'name': airport.name,
                'country': airport.country,
                'latitude': airport.latitude,
                'longitude': airport.longitude
            }
            for airport in path
        ]
        
        return jsonify({
            'price': round(price, 2),
            'route': route
        })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
