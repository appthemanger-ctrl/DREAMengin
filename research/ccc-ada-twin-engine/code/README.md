# CCC / ADA Twin-Engine Code Artifacts

This directory is reserved for research-specific reproducibility code that belongs to the CCC / ADA archive and is not part of the DREAMengin product runtime.

## Expected code files

| File | Description |
|------|-------------|
| `w3_decoder_optimized.py` | Weight-3 GF(256) decoder implementation used by the decoder benchmark notes |

## Code archive rule

Research scripts placed here should be self-contained, should not import DREAMengin application modules, and should write derived outputs into the local `data/` folder or an ignored temporary path.
