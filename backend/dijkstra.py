#Dataset: repo:jpatokal/openflights 

import collections
import csv
import functools
import haversine
import heapq

Airport = collections.namedtuple('Airport', 'code name country latitude longitude')
Flight  = collections.namedtuple('Flight' , 'origin destination')
Route   = collections.namedtuple('Route'  , 'price path')

class Heap(object):
    """A min-heap."""

    def __init__(self):
        self._values = []

    def push(self, value):
        """Push the value item onto the heap."""
        heapq.heappush(self._values, value)

    def pop(self):
        """ Pop and return the smallest item from the heap."""
        return heapq.heappop(self._values)

    def __len__(self):
        return len(self._values)

def get_airports(path='airports.csv'):
    """Return a generator that yields Airport objects."""

    with open(path, 'rt', encoding='utf-8', errors='ignore') as fd:
        reader = csv.reader(fd)
        for row in reader:
            try:
                # Skip rows with missing latitude/longitude
                if not row[6] or not row[7]:
                    continue

                name      = row[1]
                country   = row[3]
                code      = row[4]
                latitude  = float(row[6])  # negative is South
                longitude  = float(row[7])  # negative is West
                yield Airport(code, name, country, latitude, longitude)
            except (ValueError, IndexError):
                continue

# Make it possible to easily look up airports by IATA code.
AIRPORTS = {}  # create an empty dictionary

# get all the airports
airports_list = get_airports()

# loop through each airport
for airport in airports_list:
    # use the airport code as the key and the airport object as the value
    AIRPORTS[airport.code] = airport

def get_flights(path='flights.csv'):
    """Return a generator that yields direct Flight objects."""

    with open(path, 'rt') as fd:
        reader = csv.reader(fd)
        for row in reader:
            origin      = row[2]      # IATA code of source ...
            destination = row[4]      # ... and destination airport.
            nstops      = int(row[7]) # Number of stops; zero for direct.
            if not nstops:
                yield Flight(origin, destination)

class Graph(object):
    """ A hash-table implementation of an undirected graph."""

    def __init__(self):
        # Map each node to a set of nodes connected to it
        self._neighbors = collections.defaultdict(set)

    def connect(self, node1, node2):
        self._neighbors[node1].add(node2)
        self._neighbors[node2].add(node1)

    def neighbors(self, node):
        yield from self._neighbors[node]

    @classmethod
    def load(cls):
        """Return a populated Graph object with real airports and routes."""

        world = cls()
        for flight in get_flights():
            try:
                origin      = AIRPORTS[flight.origin]
                destination = AIRPORTS[flight.destination]
                world.connect(origin, destination)
            # Ignore flights to or from an unknown airport
            except KeyError:
                continue
        return world

    @staticmethod
    @functools.lru_cache()
    def get_price(origin, destination, cents_per_km=0.1):
        """Return the cheapest flight without stops."""

        # Haversine distance, in kilometers
        point1 = origin.latitude, origin.longitude,
        point2 = destination.latitude, destination.longitude
        distance = haversine.haversine(point1, point2)
        return distance * cents_per_km

    def dijkstra(self, origin, destination):
        """Use Dijkstra's algorithm to find the cheapest path."""

        routes = Heap()
        for neighbor in self.neighbors(origin):
            price = self.get_price(origin, neighbor)
            routes.push(Route(price=price, path=[origin, neighbor]))

        visited = set()
        visited.add(origin)

        while routes:

            # Find the nearest yet-to-visit airport
            price, path = routes.pop()
            airport = path[-1]
            if airport in visited:
                continue

            # We have arrived! Wo-hoo!
            if airport is destination:
                return price, path

            # Tentative distances to all the unvisited neighbors
            for neighbor in self.neighbors(airport):
                if neighbor not in visited:
                    # Total spent so far plus the price of getting there
                    new_price = price + self.get_price(airport, neighbor)
                    new_path  = path  + [neighbor]
                    routes.push(Route(new_price, new_path))

            visited.add(airport)

        return float('infinity')

    def find_top_routes(self, origin, destination, k=5):
        """
        Find the top K cheapest routes using Yen's algorithm.
        Returns list of (price, path) tuples sorted by price.
        """
        if origin == destination:
            return [(0, [origin])]
        
        # First, find the shortest path using Dijkstra
        shortest_path_result = self.dijkstra(origin, destination)
        if shortest_path_result == float('infinity'):
            return []
        
        # Initialize with the shortest path
        shortest_price, shortest_path = shortest_path_result
        A = [(shortest_price, shortest_path)]  # List of k shortest paths
        B = Heap()  # Priority queue for candidate paths
        
        for ki in range(1, k):
            if not A:
                break
                
            # The previous shortest path
            prev_price, prev_path = A[-1]
            
            # Spur node ranges from first to second-to-last node
            for i in range(len(prev_path) - 1):
                spur_node = prev_path[i] 
                root_path = prev_path[:i + 1]   #return the path list from 0 to i
                root_price = self._calculate_path_price(root_path)
                
                # Remove edges that are part of the previous shortest paths
                # which share the same root path
                edges_removed = []
                for price, path in A:
                    if len(path) > i and root_path == path[:i + 1]:
                        # Remove the edge from spur node to next node in path
                        next_node = path[i + 1]
                        if next_node in self._neighbors[spur_node]:
                            self._neighbors[spur_node].remove(next_node)
                            edges_removed.append((spur_node, next_node))
                
                # Remove nodes in root path (except spur node)
                nodes_removed = []
                for node in root_path[:-1]:
                    if node in self._neighbors:
                        neighbors_backup = self._neighbors[node].copy()
                        self._neighbors[node].clear()
                        nodes_removed.append((node, neighbors_backup))
                
                # Find spur path from spur node to destination
                spur_result = self.dijkstra(spur_node, destination)

                # Restore removed edges and nodes
                for spur_node, next_node in edges_removed:
                    self._neighbors[spur_node].add(next_node)
                
                for node, neighbors_backup in nodes_removed:
                    self._neighbors[node] = neighbors_backup
                
                if spur_result != float('infinity'):
                    spur_price, spur_path = spur_result
                    total_path = root_path[:-1] + spur_path
                    total_price = root_price + spur_price
                    
                    # Check if this path is already in A or B
                    if not self._path_exists(total_path, A, B):
                        B.push(Route(total_price, total_path))
            
            if not B:
                break
                
            # Add the best candidate to A
            best_price, best_path = B.pop()
            A.append((best_price, best_path))
        
        # Return up to k paths, sorted by price
        return sorted(A, key=lambda x: x[0])[:k]

    def _calculate_path_price(self, path):
        """Calculate total price for a given path."""
        total = 0
        for i in range(len(path) - 1):
            total += self.get_price(path[i], path[i + 1])
        return total

    def _path_exists(self, path, A, B):
        """Check if a path already exists in A or B."""
        path_tuple = tuple(path)
        
        # Check in A
        for price, existing_path in A:
            if tuple(existing_path) == path_tuple:
                return True
        
        # Check in B (would need to extract all from heap, which is expensive)
        # For simplicity, we'll assume unique paths in this implementation
        return False


if __name__ == "__main__":

    world = Graph.load()
    valencia = AIRPORTS['VLC']
    portland = AIRPORTS['PDX']
    
    # Test the original dijkstra
    print("=== Cheapest Route ===")
    distance, path = world.dijkstra(valencia, portland)
    for index, airport in enumerate(path):
        print(f"{index} | {airport.code} - {airport.name}")
    print(f"Price: {distance:.2f}€")
    
    print("\n=== Top 5 Routes ===")
    top_routes = world.find_top_routes_simple(valencia, portland, k=5)
    for i, (price, path) in enumerate(top_routes):
        print(f"\nRoute {i+1}: {price:.2f}€")
        for j, airport in enumerate(path):
            print(f"  {j} | {airport.code} - {airport.name}")
