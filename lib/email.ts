import supabase from "@/lib/db";

export class EmailService {
  // Generate 6-digit random code
  static generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Save verification code to database (temporary storage)
  static async saveVerificationCode(email: string, code: string): Promise<boolean> {
    try {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Expires in 10 minutes

      const { error } = await supabase
        .from('email_verifications')
        .upsert([
          {
            email,
            code,
            expires_at: expiresAt.toISOString(),
            is_verified: false
          }
        ]);

      return !error;
    } catch (error) {
      console.error('Save verification code error:', error);
      return false;
    }
  }

  // Verify code
  static async verifyCode(email: string, code: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('email_verifications')
        .select('*')
        .eq('email', email)
        .eq('code', code)
        .eq('is_verified', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        return false;
      }

      // Mark as verified
      await supabase
        .from('email_verifications')
        .update({ is_verified: true })
        .eq('id', data.id);

      return true;
    } catch (error) {
      console.error('Verify code error:', error);
      return false;
    }
  }

  // Send verification email (using a simple email service)
  static async sendVerificationEmail(email: string, code: string): Promise<boolean> {
    try {
      // For now, we'll just log the code (in production, use real email service)
      console.log(`Verification code for ${email}: ${code}`);
      
      // In production, integrate with email service like:
      // - SendGrid
      // - Nodemailer
      // - Resend
      // - AWS SES
      
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('Send email error:', error);
      return false;
    }
  }
}
