# RAFTOP CPAP CARE Pro - Final Git Tag Instruction

REQUIRED_MARKER: PHASE92_FINAL_GIT_TAG_INSTRUCTION
REQUIRED_MARKER: TAG_RAFTOP_FINAL_SALE_READY

After Phase 92 passes and git status is clean, run:

git tag raftop-final-sale-ready-v1.0.0
git push origin raftop-final-sale-ready-v1.0.0

If the tag already exists:

git tag -d raftop-final-sale-ready-v1.0.0
git push origin :refs/tags/raftop-final-sale-ready-v1.0.0

git tag raftop-final-sale-ready-v1.0.0
git push origin raftop-final-sale-ready-v1.0.0
