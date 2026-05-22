DROP POLICY IF EXISTS team_members_insert_admin ON public.team_members;

CREATE POLICY team_members_insert_admin ON public.team_members
FOR INSERT
WITH CHECK (
  (
    auth.uid() = user_id
    AND role = 'owner'::team_role
    AND EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_members.team_id AND t.owner_id = auth.uid())
  )
  OR (
    is_team_admin(team_id, auth.uid())
    AND role IN ('viewer'::team_role, 'editor'::team_role)
  )
  OR (
    role = 'admin'::team_role
    AND EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_members.team_id AND t.owner_id = auth.uid())
  )
);