-- Only opaque invalidation counters cross the bridge. All public data stays on Aruba.
create table public.imc_site_revisions (
    scope text primary key check (scope ~ '^(core|IMC00[1-9]|IMC010)$'),
    revision bigint not null default 1,
    updated_at timestamptz not null default clock_timestamp()
);
alter table public.imc_site_revisions enable row level security;
revoke all on public.imc_site_revisions from public, anon, authenticated;
grant select on public.imc_site_revisions to anon, authenticated;
create policy public_site_revision_read on public.imc_site_revisions
    for select to anon, authenticated using (true);
alter publication supabase_realtime add table public.imc_site_revisions;

create function public.imc_publish_site_change(scope_name text, signed_at bigint, signature text)
returns void language plpgsql security definer set search_path = '' as $$
declare
    secret text;
    expected text;
begin
    if scope_name is null or scope_name !~ '^(core|IMC00[1-9]|IMC010)$'
        or signed_at is null or abs(extract(epoch from clock_timestamp())-signed_at)>60
        or signature is null or signature !~ '^[0-9a-f]{64}$' then
        raise exception 'Invalid site signal';
    end if;
    select decrypted_secret into strict secret
        from vault.decrypted_secrets where name='imc_aruba_connector_key';
    expected := encode(extensions.hmac('site-change-v1|'||scope_name||'|'||signed_at,secret,'sha256'),'hex');
    if expected is null or expected <> signature then raise exception 'Invalid site signal'; end if;
    insert into public.imc_site_revisions(scope) values(scope_name)
    on conflict(scope) do update set revision=imc_site_revisions.revision+1, updated_at=clock_timestamp();
end;
$$;
revoke all on function public.imc_publish_site_change(text,bigint,text) from public, authenticated, anon;
grant execute on function public.imc_publish_site_change(text,bigint,text) to anon;
