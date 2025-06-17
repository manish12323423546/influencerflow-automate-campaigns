#!/bin/bash

# Deploy the upload-report-pdf edge function
echo "Deploying upload-report-pdf edge function..."
cd /Users/abhishekrajpurohit/Downloads/influencerflow-automate-campaigns
npx supabase functions deploy upload-report-pdf

# Deploy the generate-report edge function
echo "Deploying generate-report edge function..."
cd /Users/abhishekrajpurohit/Downloads/influencerflow-automate-campaigns
npx supabase functions deploy generate-report

echo "Edge functions deployed successfully!"