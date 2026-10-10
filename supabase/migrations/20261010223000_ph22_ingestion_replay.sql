-- Capture routes read a fresh revision on retry. Operation identity must bind
-- identical validated facts, not that incidental refreshed revision. The initial
-- mutation still checks expected revision atomically. LOCAL candidate only.
begin;
do $$declare body text;old_hash text;new_hash text;old_check text;new_check text;begin
 body:=pg_get_functiondef('phron_private.ingest_mutate(uuid,text,jsonb)'::regprocedure);
 old_hash:=$anchor$supplied_hash:='ph19:'||encode(sha256(convert_to(jsonb_build_object('kind','ingest', 'revision',expected, 'input',input)::text,'UTF8')),'hex');$anchor$;
 new_hash:=$anchor$supplied_hash:='ph22:'||encode(sha256(convert_to(jsonb_build_object('kind','ingest','input',input)::text,'UTF8')),'hex');$anchor$;
 old_check:=$anchor$if replay.kind<>'ingest' or replay.fingerprint<>supplied_hash then raise exception 'REPLAY_MISMATCH'; end if;$anchor$;
 new_check:=$anchor$if replay.kind<>'ingest' or (replay.fingerprint<>supplied_hash and replay.fingerprint<>'ph19:'||encode(sha256(convert_to(jsonb_build_object('kind','ingest','revision',((replay.result#>>'{data,snapshot,revision}')::bigint-1)::text,'input',input)::text,'UTF8')),'hex')) then raise exception 'REPLAY_MISMATCH';end if;$anchor$;
 if position(old_hash in body)=0 or position(old_check in body)=0 then raise exception 'PH22_PREDECESSOR_MISMATCH';end if;
 execute replace(replace(body,old_hash,new_hash),old_check,new_check);
end$$;
notify pgrst,'reload schema';commit;
