-- Persist RAG citations alongside assistant messages so they survive chat reloads.
alter table public.chat_messages
  add column if not exists metadata jsonb not null default '{}'::jsonb;

-- Expose the original uploaded filename through the existing retrieval metadata
-- without changing the function's return signature or exposing Storage URLs.
create or replace function public.match_knowledge_chunks(
  query_embedding extensions.vector(768),
  match_threshold double precision default 0.70,
  match_count integer default 5,
  filter jsonb default '{}'::jsonb
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  metadata jsonb,
  title text,
  source_key text,
  similarity double precision
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    c.id,
    c.document_id,
    c.content,
    c.metadata || jsonb_build_object(
      'document_title', d.title,
      'source_key', d.source_key,
      'original_name', d.metadata ->> 'original_name'
    ),
    d.title,
    d.source_key,
    1 - (c.embedding operator(extensions.<=>) query_embedding) as similarity
  from public.knowledge_chunks as c
  join public.knowledge_documents as d on d.id = c.document_id
  where d.status = 'active'
    and (filter = '{}'::jsonb or c.metadata @> filter)
    and 1 - (c.embedding operator(extensions.<=>) query_embedding) >= greatest(0, least(1, match_threshold))
  order by c.embedding operator(extensions.<=>) query_embedding
  limit greatest(1, least(20, match_count));
$$;
