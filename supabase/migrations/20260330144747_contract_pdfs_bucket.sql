-- Migration: Create private contract-pdfs storage bucket
-- Issue #11 [M1.3] — PDF upload to Supabase Storage
--
-- Bucket is private (no public access). Authenticated users can upload
-- and read objects via signed URLs. No public URLs are allowed.

INSERT INTO storage.buckets (id, name, public)
  VALUES ('contract-pdfs', 'contract-pdfs', false)
  ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload PDFs
CREATE POLICY "Authenticated users can upload PDFs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'contract-pdfs');

-- Allow authenticated users to read (download / sign) PDFs
CREATE POLICY "Authenticated users can read PDFs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'contract-pdfs');
