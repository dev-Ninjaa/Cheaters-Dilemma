from app.api.schemas.simulation import SimulationSummary


def test_simulation_summary_includes_blockchain_transfers():
    payload = {
        "simulation_id": "sim-123",
        "seed": 42,
        "turns_completed": 200,
        "leaderboard": [],
        "action_counts": {},
        "log_digest": "abc",
        "rules_version": 1,
        "blockchain_transfers": {"executed": 10, "failed": 2, "total_transfers": 12},
    }

    summary = SimulationSummary(**payload)

    assert summary.blockchain_transfers is not None
    assert summary.blockchain_transfers.executed == 10
    assert summary.blockchain_transfers.failed == 2
    assert summary.blockchain_transfers.total_transfers == 12
