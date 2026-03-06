from types import SimpleNamespace
import pytest

from src.repositories.base import BaseRepository


class DummyModel:
    pass


class DummySchema:
    pass


class DummyRepo(BaseRepository):
    model = DummyModel
    schema = DummySchema


@pytest.mark.asyncio
async def test_base_repository_has_model_and_schema():
    repo = DummyRepo(None)
    assert repo.model is DummyModel
    assert repo.schema is DummySchema


@pytest.mark.asyncio
async def test_base_repository_get_all_delegates_to_get_filtered(monkeypatch):
    repo = DummyRepo(None)

    called = {}

    async def fake_get_filtered(**kwargs):
        called["kwargs"] = kwargs
        return ["ok", kwargs]

    monkeypatch.setattr(repo, "get_filtered", fake_get_filtered)

    result = await repo.get_all()
    assert result == ["ok", {}]
    assert called["kwargs"] == {}


@pytest.mark.asyncio
async def test_base_repository_create_has_session():
    session = object()
    repo = DummyRepo(session)
    assert repo.session is session


def test_base_repository_model_declared():
    assert DummyRepo.model is DummyModel


def test_base_repository_schema_declared():
    assert DummyRepo.schema is DummySchema