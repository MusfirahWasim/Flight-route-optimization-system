import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Plane, DollarSign, AlertCircle, Loader2, Search, X, ChevronDown, ChevronUp } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

interface Airport {
  code: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface RouteResponse {
  price: number;
  route: Airport[];
}

interface TopRoutesResponse {
  top_routes: RouteResponse[];
  count: number;
}

function SearchableDropdown({
  airports,
  value,
  onChange,
  placeholder,
  label
}: {
  airports: Airport[];
  value: string;
  onChange: (code: string) => void;
  placeholder: string;
  label: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredAirports = airports.filter((airport) => {
    const search = searchTerm.toLowerCase();
    return (
      airport.code.toLowerCase().includes(search) ||
      airport.name.toLowerCase().includes(search) ||
      airport.country.toLowerCase().includes(search)
    );
  });

  const selectedAirport = airports.find((a) => a.code === value);

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  return (
    <div ref={dropdownRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer bg-white flex items-center justify-between"
      >
        <span className={selectedAirport ? 'text-gray-900' : 'text-gray-500'}>
          {selectedAirport
            ? `${selectedAirport.code} - ${selectedAirport.name} (${selectedAirport.country})`
            : placeholder}
        </span>
        <div className="flex items-center gap-2">
          {selectedAirport && (
            <X
              className="w-4 h-4 text-gray-400 hover:text-gray-600"
              onClick={handleClear}
            />
          )}
          <Search className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search airports..."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="overflow-y-auto max-h-64">
            {filteredAirports.length > 0 ? (
              filteredAirports.map((airport) => (
                <div
                  key={airport.code}
                  onClick={() => handleSelect(airport.code)}
                  className={`px-4 py-3 cursor-pointer hover:bg-indigo-50 transition-colors ${
                    airport.code === value ? 'bg-indigo-100' : ''
                  }`}
                >
                  <div className="font-semibold text-gray-900">
                    {airport.code} - {airport.name}
                  </div>
                  <div className="text-sm text-gray-600">{airport.country}</div>
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-gray-500 text-center">No airports found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RouteCard({ route, index, isExpanded, onToggle }: { 
  route: RouteResponse; 
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const projectToMap = (lat: number, lon: number) => {
    const x = ((lon + 180) / 360) * 800;
    const y = ((90 - lat) / 180) * 400;
    return { x, y };
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div 
        className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
            index === 0 ? 'bg-green-500' : 
            index === 1 ? 'bg-blue-500' : 
            index === 2 ? 'bg-purple-500' : 'bg-gray-500'
          }`}>
            {index + 1}
          </div>
          <div>
            <div className="font-semibold text-gray-800">
              Route #{index + 1} {index === 0 && <span className="text-green-600 text-sm">(Cheapest)</span>}
            </div>
            <div className="text-sm text-gray-600">
              {route.route.length - 1} {route.route.length - 1 === 1 ? 'flight' : 'flights'} • {route.route.map(a => a.code).join(' → ')}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold text-indigo-600">€{route.price.toFixed(2)}</div>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-6 space-y-6 bg-white">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              Flight Path
            </h3>
            {route.route.map((airport, airportIndex) => (
              <div key={airportIndex} className="flex items-center gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-700 font-bold">{airportIndex + 1}</span>
                </div>
                <div className="flex-grow bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="font-semibold text-gray-800">
                    {airport.code} - {airport.name}
                  </div>
                  <div className="text-sm text-gray-600">{airport.country}</div>
                </div>
                {airportIndex < route.route.length - 1 && (
                  <Plane className="w-5 h-5 text-gray-400 transform rotate-90" />
                )}
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Route Map</h3>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 overflow-x-auto">
              <svg width="800" height="400" className="mx-auto">
                <rect width="800" height="400" fill="#e0f2fe" />
                
                {route.route.slice(0, -1).map((airport, lineIndex) => {
                  const start = projectToMap(airport.latitude, airport.longitude);
                  const end = projectToMap(
                    route.route[lineIndex + 1].latitude,
                    route.route[lineIndex + 1].longitude
                  );
                  return (
                    <line
                      key={`line-${lineIndex}`}
                      x1={start.x}
                      y1={start.y}
                      x2={end.x}
                      y2={end.y}
                      stroke="#4f46e5"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                  );
                })}

                {route.route.map((airport, markerIndex) => {
                  const pos = projectToMap(airport.latitude, airport.longitude);
                  const isStart = markerIndex === 0;
                  const isEnd = markerIndex === route.route.length - 1;
                  return (
                    <g key={`marker-${markerIndex}`}>
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="8"
                        fill={isStart ? '#10b981' : isEnd ? '#ef4444' : '#4f46e5'}
                        stroke="white"
                        strokeWidth="2"
                      />
                      <text
                        x={pos.x}
                        y={pos.y - 15}
                        textAnchor="middle"
                        className="text-xs font-bold"
                        fill="#1e3a8a"
                      >
                        {airport.code}
                      </text>
                    </g>
                  );
                })}
              </svg>
              <div className="flex justify-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
                  <span className="text-gray-700">Origin</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-indigo-600 border-2 border-white"></div>
                  <span className="text-gray-700">Stopover</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white"></div>
                  <span className="text-gray-700">Destination</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FlightRouteFinder() {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RouteResponse | null>(null);
  const [topRoutes, setTopRoutes] = useState<TopRoutesResponse | null>(null);
  const [error, setError] = useState('');
  const [expandedRoute, setExpandedRoute] = useState<number | null>(0); // Expand first route by default

  useEffect(() => {
    fetchAirports();
  }, []);

  const clearSelection = () => {
    setOrigin('');
    setDestination('');
    setResult(null);
    setTopRoutes(null);
    setError('');
    setExpandedRoute(0);
  };

  const fetchAirports = async () => {
    try {
      const response = await fetch(`${API_BASE}/airports`);
      const data = await response.json();
      setAirports(data.sort((a: Airport, b: Airport) => a.code.localeCompare(b.code)));
    } catch (err) {
      setError('Failed to load airports. Make sure the backend is running.');
    }
  };

  const findRoute = async () => {
    if (!origin || !destination) {
      setError('Please select both origin and destination');
      return;
    }

    if (origin === destination) {
      setError('Origin and destination must be different');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setTopRoutes(null);

    try {
      const response = await fetch(`${API_BASE}/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          origin, 
          destination,
          top_routes: true 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to find route');
      }

      const data = await response.json();
      setTopRoutes(data);
      setExpandedRoute(0); // Expand the first (cheapest) route by default
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleRouteExpansion = (index: number) => {
    setExpandedRoute(expandedRoute === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <Plane className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">Flight Route Finder</h1>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <SearchableDropdown
              airports={airports}
              value={origin}
              onChange={setOrigin}
              placeholder="Select origin..."
              label="Origin Airport"
            />

            <SearchableDropdown
              airports={airports}
              value={destination}
              onChange={setDestination}
              placeholder="Select destination..."
              label="Destination Airport"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={findRoute}
              disabled={loading || !origin || !destination}
              className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Finding routes...
                </>
              ) : (
                <>
                  <Plane className="w-5 h-5" />
                  Find Top 5 Cheapest Routes
                </>
              )}
            </button>

            <button
              onClick={clearSelection}
              className="flex-1 bg-gray-300 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
            >
              Clear
            </button>
          </div>

          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {topRoutes && topRoutes.top_routes.length > 0 && (
            <div className="mt-8 space-y-6">
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 border border-indigo-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-2xl font-bold text-gray-800">Found {topRoutes.count} Routes</h2>
                </div>
                <p className="text-sm text-gray-600">
                  Showing the top {topRoutes.count} cheapest routes from {origin} to {destination}
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-indigo-600" />
                  Available Routes (Sorted by Price)
                </h2>
                
                {topRoutes.top_routes.map((route, index) => (
                  <RouteCard
                    key={index}
                    route={route}
                    index={index}
                    isExpanded={expandedRoute === index}
                    onToggle={() => toggleRouteExpansion(index)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Using Dijkstra's algorithm to find the optimal routes based on distance</p>
          <p className="mt-1">Showing top 5 cheapest routes with detailed comparisons</p>
        </div>
      </div>
    </div>
  );
}