# shaft-torsion-calc
TypeScript Node CLI (zero runtime deps, MIT, README in English) for solid/hollow circular shafts in torsion (Shigley / 机械设计手册).
- Inputs: --power kW and --rpm, OR --torque N·m; --d outer diameter mm; --di inner diameter mm (default 0 = solid); --length mm (optional); --G shear modulus MPa (default 79300); --allow allowable shear stress MPa (optional); --size: if given with --allow and no --d, compute minimum solid diameter d = (16T/(π·τallow))^(1/3).
- Output: torque T (N·m, from T = 9550·P/n), polar moment J = π(d⁴−di⁴)/32 (mm⁴), max shear τ = 16·T·d/(π(d⁴−di⁴)) (MPa, T in N·mm), twist angle θ = T·L/(G·J) in rad and degrees (if length), safety factor allow/τ (if allow). Table and --json. Validate inputs (positive, di<d, either power+rpm or torque).
- Tests (node:test): P 5 kW n 1450 → T ≈32.931 N·m; d 20 solid → τ ≈20.97 MPa; L 500 → θ ≈0.7574°; hollow d 30 di 20 consistent with formula; sizing T 32.931 allow 40 → d ≈16.13 mm (compute from formula; trust the formula over these hints); invalid inputs error.
- npm test must build and pass. .gitignore node_modules/ dist/ *.log. No secrets, no personal info.
