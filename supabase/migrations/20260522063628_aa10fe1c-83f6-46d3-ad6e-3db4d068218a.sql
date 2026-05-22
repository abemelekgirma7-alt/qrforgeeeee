
CREATE POLICY "team_members_update_owner_only"
ON public.team_members
FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_members.team_id AND t.owner_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_members.team_id AND t.owner_id = auth.uid())
  AND role <> 'owner'::team_role
);

CREATE POLICY "user_roles_update_admin"
ON public.user_roles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
