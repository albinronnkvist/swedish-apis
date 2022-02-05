# Swedish API list (WIP)
A list of Swedish APIs (work in progress)

---

## Base URL
https://swedishapis.herokuapp.com

---

## Public endpoints
### GET /entries
List of all available APIs.

Query parameters:
  - ?title=[cats]
    - Filter by title.
  - &description=[cat pictures]
    - Filter by description.
  - &category=[animals] 
    - Filter by category name (not id).
  - &limit=[10] 
    - Optional amount of results. Defaults to 20.

---

### GET /entries/random
Random API.

---

### GET /entries/:id
Single API from id.

---

### GET /categories
List of all categories.

Query parameters:
 - ?title=[animals]
   - Filter by title.

---

### GET /categories/:id
Single category from id.

---
