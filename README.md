# ✈️ Flight Route Optimization System

This project implements a flight route optimization system using real-world aviation data from the OpenFlights dataset. It computes the **cheapest route** and **top K cheapest routes** between airports using advanced graph algorithms.

---

## 📌 Features

* 🌍 Load real-world airport and flight datasets
* 🔗 Build a global flight network graph
* 💰 Estimate flight costs using geographical distance
* 🚀 Find cheapest route using **Dijkstra’s Algorithm**
* 🛤️ Find top K routes using **Yen’s Algorithm**
* ⚡ Efficient implementation using heaps and caching

---

## 🗂️ Dataset

Based on the **OpenFlights dataset**:

* `airports.csv` → Airport information
* `flights.csv` → Flight routes

Source: [https://github.com/jpatokal/openflights](https://github.com/jpatokal/openflights)

---

## 🏗️ Project Structure

```
.
├── airports.csv          # Airport dataset
├── flights.csv           # Flight routes dataset
├── data-format.txt       # Dataset schema/format description
├── dijkstra.py           # Core implementation (graph + algorithms)
├── README.md
```

---

## ⚙️ Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/flight-route-optimizer.git
cd flight-route-optimizer
```

2. Install required dependency:

```bash
pip install haversine
```

---

## 🚀 Usage

Run the main script:

```bash
python dijkstra.py
```

---

## 🧠 How It Works

### 1. Data Parsing

* Reads airport and flight data from CSV files
* Skips invalid or incomplete entries
* Stores airports in a dictionary for fast lookup

---

### 2. Graph Construction

* Each airport = **node**
* Each direct flight = **edge**
* Graph is **undirected**

---

### 3. Cost Calculation

Flight price is estimated using:

```
price = distance × cost_per_km
```

* Distance is computed using the **Haversine formula**
* Default rate: `0.1 per km`

---

### 4. Algorithms

#### 🔹 Dijkstra’s Algorithm

* Finds the **single cheapest route**
* Uses a **priority queue (min-heap)**

#### 🔹 Yen’s Algorithm

* Finds **top K cheapest routes**
* Generates alternative paths
* Avoids duplicate routes

---

## 📊 Example Output

```
=== Cheapest Route ===
0 | VLC - Valencia Airport
1 | XXX - Transit Airport
2 | PDX - Portland International Airport
Price: 523.45€

=== Top 5 Routes ===

Route 1: 523.45€
Route 2: 540.10€
Route 3: 580.75€
...
```

---

## 🧩 Key Components

### `Airport`

Stores:

* IATA code
* Name
* Country
* Coordinates

---

### `Flight`

Represents a direct connection:

* Origin airport
* Destination airport

---

### `Graph`

Handles:

* Building the network
* Running Dijkstra & Yen algorithms

---

### `Heap`

Custom wrapper over Python’s `heapq` for efficient priority queue operations

---

<img width="1128" height="619" alt="image" src="https://github.com/user-attachments/assets/7139cad5-43a7-4210-9f6c-a14626bdf21a" />


- [OpenFlights](https://openflights.org/) for providing the airport and route datasets
- The Haversine formula for accurate distance calculations
- Dijkstra and Yen for their fundamental algorithms
