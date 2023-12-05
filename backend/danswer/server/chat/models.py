from datetime import datetime
from typing import Any

from pydantic import BaseModel

from danswer.configs.app_configs import DOCUMENT_INDEX_NAME
from danswer.configs.constants import DocumentSource
from danswer.configs.constants import MessageType
from danswer.configs.constants import QAFeedbackType
from danswer.configs.constants import SearchFeedbackType
from danswer.direct_qa.interfaces import DanswerAnswer
from danswer.direct_qa.interfaces import DanswerQuote
from danswer.search.models import BaseFilters
from danswer.search.models import QueryFlow
from danswer.search.models import SearchType


class ChatSessionCreationRequest(BaseModel):
    persona_id: int | None = None


class HelperResponse(BaseModel):
    values: dict[str, str]
    details: list[str] | None = None


class SearchDoc(BaseModel):
    document_id: str
    semantic_identifier: str
    link: str | None
    blurb: str
    source_type: str
    boost: int
    # whether the document is hidden when doing a standard search
    # since a standard search will never find a hidden doc, this can only ever
    # be `True` when doing an admin search
    hidden: bool
    score: float | None
    # Matched sections in the doc. Uses Vespa syntax e.g. <hi>TEXT</hi>
    # to specify that a set of words should be highlighted. For example:
    # ["<hi>the</hi> <hi>answer</hi> is 42", "the answer is <hi>42</hi>""]
    match_highlights: list[str]
    # when the doc was last updated
    updated_at: datetime | None

    def dict(self, *args: list, **kwargs: dict[str, Any]) -> dict[str, Any]:  # type: ignore
        initial_dict = super().dict(*args, **kwargs)  # type: ignore
        initial_dict["updated_at"] = (
            self.updated_at.isoformat() if self.updated_at else None
        )
        return initial_dict


class RetrievalDocs(BaseModel):
    top_documents: list[SearchDoc]


# First chunk of info for streaming QA
class QADocsResponse(RetrievalDocs):
    predicted_flow: QueryFlow
    predicted_search: SearchType
    time_cutoff: datetime | None
    favor_recent: bool

    def dict(self, *args: list, **kwargs: dict[str, Any]) -> dict[str, Any]:  # type: ignore
        initial_dict = super().dict(*args, **kwargs)  # type: ignore
        initial_dict["time_cutoff"] = (
            self.time_cutoff.isoformat() if self.time_cutoff else None
        )
        return initial_dict


# Second chunk of info for streaming QA
class LLMRelevanceFilterResponse(BaseModel):
    relevant_chunk_indices: list[int]


# TODO: rename/consolidate once the chat / QA flows are merged
class NewMessageRequest(BaseModel):
    chat_session_id: int
    query: str
    filters: BaseFilters
    collection: str = DOCUMENT_INDEX_NAME
    search_type: SearchType = SearchType.HYBRID
    enable_auto_detect_filters: bool = True
    favor_recent: bool | None = None
    # Is this a real-time/streaming call or a question where Danswer can take more time?
    real_time: bool = True
    # Pagination purposes, offset is in batches, not by document count
    offset: int | None = None


class CreateChatSessionID(BaseModel):
    chat_session_id: int


class ChatFeedbackRequest(BaseModel):
    chat_session_id: int
    message_number: int
    edit_number: int
    is_positive: bool | None = None
    feedback_text: str | None = None


class CreateChatMessageRequest(BaseModel):
    chat_session_id: int
    message_number: int
    parent_edit_number: int | None
    message: str
    persona_id: int | None


class ChatMessageIdentifier(BaseModel):
    chat_session_id: int
    message_number: int
    edit_number: int


class RegenerateMessageRequest(ChatMessageIdentifier):
    persona_id: int | None


class ChatRenameRequest(BaseModel):
    chat_session_id: int
    name: str | None
    first_message: str | None


class RenameChatSessionResponse(BaseModel):
    new_name: str  # This is only really useful if the name is generated


class ChatSession(BaseModel):
    id: int
    name: str
    time_created: str


class ChatSessionsResponse(BaseModel):
    sessions: list[ChatSession]


class ChatMessageDetail(BaseModel):
    message_number: int
    edit_number: int
    parent_edit_number: int | None
    latest: bool
    message: str
    context_docs: RetrievalDocs | None
    message_type: MessageType
    time_sent: datetime


class ChatSessionDetailResponse(BaseModel):
    chat_session_id: int
    description: str
    messages: list[ChatMessageDetail]


class QueryValidationResponse(BaseModel):
    reasoning: str
    answerable: bool


class QAFeedbackRequest(BaseModel):
    query_id: int
    feedback: QAFeedbackType


class SearchFeedbackRequest(BaseModel):
    query_id: int
    document_id: str
    document_rank: int
    click: bool
    search_feedback: SearchFeedbackType


class AdminSearchRequest(BaseModel):
    query: str
    filters: BaseFilters


class AdminSearchResponse(BaseModel):
    documents: list[SearchDoc]


class SearchResponse(RetrievalDocs):
    query_event_id: int
    source_type: list[DocumentSource] | None
    time_cutoff: datetime | None
    favor_recent: bool


class QAResponse(SearchResponse, DanswerAnswer):
    quotes: list[DanswerQuote] | None
    predicted_flow: QueryFlow
    predicted_search: SearchType
    eval_res_valid: bool | None = None
    llm_chunks_indices: list[int] | None = None
    error_msg: str | None = None
