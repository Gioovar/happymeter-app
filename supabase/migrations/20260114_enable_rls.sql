-- 1. Enable RLS on all identified tables
ALTER TABLE "Response" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Answer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Question" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BrandAsset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PushSubscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TeamMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Sale" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Coupon" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Survey" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LinkClick" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SellerLead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AIInsight" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatThread" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AffiliateProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Commission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payout" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SystemSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Referral" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RepresentativeCommission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RepresentativePayout" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RepresentativeProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdminChat" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdminChatMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Course" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Place" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlaceVisit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CreatorReview" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Achievement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CreatorAchievement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TeamInvitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Module" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lesson" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserLessonProgress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LoyaltyRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LoyaltyReward" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LoyaltyTier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LoyaltyRedemption" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LoyaltyVisit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LoyaltyProgram" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LoyaltyEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LoyaltyPromotion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LoyaltyNotification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProcessEvidence" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LoyaltyCustomer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProcessZone" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProcessTask" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Reservation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FloorPlan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Table" ENABLE ROW LEVEL SECURITY;

-- 2. Create Policies
-- Note: These policies assume standard Supabase auth (auth.uid()) and that the application uses the service role for backend operations where strict ownership isn't applicable.

-- UserSettings
CREATE POLICY "Users can view own settings" ON "UserSettings" FOR SELECT USING (userId = auth.uid());
CREATE POLICY "Users can update own settings" ON "UserSettings" FOR UPDATE USING (userId = auth.uid());

-- Survey
CREATE POLICY "Users can CRUD own surveys" ON "Survey" USING (userId = auth.uid());

-- Questions (via Survey)
CREATE POLICY "Users can CRUD questions for their surveys" ON "Question" USING (
  EXISTS (SELECT 1 FROM "Survey" s WHERE s.id = "surveyId" AND s.userId = auth.uid())
);

-- Response (Public Insert, Owner View)
CREATE POLICY "Public can insert responses" ON "Response" FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners can view responses" ON "Response" FOR SELECT USING (
  EXISTS (SELECT 1 FROM "Survey" s WHERE s.id = "surveyId" AND s.userId = auth.uid())
);

-- Answer (Public Insert, Owner View)
CREATE POLICY "Public can insert answers" ON "Answer" FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners can view answers" ON "Answer" FOR SELECT USING (
  EXISTS (SELECT 1 FROM "Response" r JOIN "Survey" s ON r."surveyId" = s.id WHERE r.id = "responseId" AND s.userId = auth.uid())
);

-- FloorPlan
CREATE POLICY "Users can CRUD own floorplans" ON "FloorPlan" USING (userId = auth.uid());

-- Table
CREATE POLICY "Users can CRUD own tables" ON "Table" USING (
  EXISTS (SELECT 1 FROM "FloorPlan" fp WHERE fp.id = "floorPlanId" AND fp.userId = auth.uid())
);

-- Reservation
CREATE POLICY "Public can create reservations" ON "Reservation" FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners can view/manage reservations" ON "Reservation" USING (
  EXISTS (SELECT 1 FROM "Table" t JOIN "FloorPlan" fp ON t."floorPlanId" = fp.id WHERE t.id = "tableId" AND fp.userId = auth.uid())
);

-- TeamMember (Access to self or owner)
CREATE POLICY "View team membership" ON "TeamMember" FOR SELECT USING (userId = auth.uid() OR ownerId = auth.uid());

-- LoyaltyProgram
CREATE POLICY "Users can manage loyalty program" ON "LoyaltyProgram" USING (userId = auth.uid());

-- ChatThread / ChatMessage (Assuming Landing Chat uses valid auth or is public? Usually landing chat is anonymous/session based. If so, policies might need to be open for session ID or similar. Assuming authenticated user chats here.)
CREATE POLICY "Users can manage own chats" ON "ChatThread" USING (userId = auth.uid());
CREATE POLICY "Users can manage own messages" ON "ChatMessage" USING (
  EXISTS (SELECT 1 FROM "ChatThread" ct WHERE ct.id = "threadId" AND ct.userId = auth.uid())
);

-- Public Read Tables (Course/Lesson/Pricing/etc - if applicable)
-- Assuming Course content is public for now? Or authenticated only?
CREATE POLICY "Authenticated users can read courses" ON "Course" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read modules" ON "Module" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read lessons" ON "Lesson" FOR SELECT TO authenticated USING (true);

-- Fix Sensitive Column Exposure (TeamInvitation.token)
-- Only inviter or intended recipient? Since we don't know recipient auth ID yet, usually just Inviter.
-- Public might need to check token validity by SELECTing WHERE token = 'xyz', but usually that's done via a Secure Function (RPC) to avoid exposing the list.
-- For standard RLS, we can restrict to Inviter.
CREATE POLICY "Inviters can view invitations" ON "TeamInvitation" USING (inviterId = auth.uid());
