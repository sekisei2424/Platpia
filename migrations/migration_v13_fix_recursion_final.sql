-- Fix infinite recursion in RLS policies (Final)
-- This migration drops existing policies that might be causing recursion and re-defines them using a SECURITY DEFINER function.

-- 1. Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can insert themselves into conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;

-- 2. Re-create the helper function to be absolutely sure it is SECURITY DEFINER
-- SECURITY DEFINER ensures the function runs with the privileges of the creator (admin), bypassing RLS on the tables it queries.
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

-- 3. Re-create policies

-- conversation_participants
CREATE POLICY "Users can view participants of their conversations" ON conversation_participants
    FOR SELECT USING (
        user_id = auth.uid() 
        OR
        is_conversation_participant(conversation_id)
    );

CREATE POLICY "Users can insert themselves into conversations" ON conversation_participants
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

-- messages
CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT USING (
        is_conversation_participant(conversation_id)
    );

CREATE POLICY "Users can insert messages in their conversations" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        is_conversation_participant(conversation_id)
    );

-- conversations
CREATE POLICY "Users can view their own conversations" ON conversations
    FOR SELECT USING (
        is_conversation_participant(id)
    );
