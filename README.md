# Expert Ground-Truth Rating

Static web application for expert rating of student fit against job postings.

## Data files

- `posting_BLIND_for_experts.csv`: 4 blinded job postings used as A1-A4
- `roster_BLIND_for_experts.csv`: blinded student transcript rows using `Candidate_Code`

Evaluation rounds:

- Set 1: A1-A4 against C01-C15
- Set 2: A1-A4 against C16-C30
- Set 3: A1-A4 against C31-C45

## Run locally

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173/`.

Admin access:

- user: `adminA`
- password: `1432`
