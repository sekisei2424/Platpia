-- Fix infinite recursion in RLS policies

-- 1. Create a helper function to check participation without triggering RLS recursion
-- This function runs as the database owner (SECURITY DEFINER), bypassing RLS on the queried tables within it.
CREATE OR REPLACE FUNCTION is_conversation_participant(_conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM conversation_participants
    WHERE conversation_id = _conversation_id
    AND user_id = auth.uid()
  );
END;
$$;

-- 2. Update conversation_participants policies
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view participants of their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can insert themselves into conversations" ON conversation_participants;

-- New policy using the helper function
CREATE POLICY "Users can view participants of their conversations" ON conversation_participants
    FOR SELECT USING (
        -- Users can always see themselves
        user_id = auth.uid() 
        OR
        -- Users can see other participants in conversations they belong to
        is_conversation_participant(conversation_id)
    );

CREATE POLICY "Users can insert themselves into conversations" ON conversation_participants
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- 3. Update messages policies to use the helper function as well (safer and cleaner)
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON messages;

CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT USING (
        is_conversation_participant(conversation_id)
    );

CREATE POLICY "Users can insert messages in their conversations" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        is_conversation_participant(conversation_id)
    );

-- 4. Update conversations policies
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;

CREATE POLICY "Users can view their own conversations" ON conversations
    FOR SELECT USING (
        is_conversation_participant(id)
    );
