import { useState, useEffect } from 'react';
import { Mail, User, CheckCircle, Building2, UserPlus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { validateLeadForm, ValidationError } from '@/lib/validation';
import { supabase } from '@/integrations/supabase/client';

interface FormData {
  name: string;
  email: string;
  industry: string;
}

interface LeadRecord {
  name: string;
  email: string;
  industry: string;
  submitted_at: string;
}

const INDUSTRY_OPTIONS = [
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance' },
  { value: 'education', label: 'Education' },
  { value: 'retail', label: 'Retail & E-commerce' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'other', label: 'Other' },
];


const INITIAL_FORM_STATE: FormData = { name: '', email: '', industry: '' };

export const LeadCaptureForm = () => {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [leadRecords, setLeadRecords] = useState<LeadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // comment by me reset submission state on component mount
  useEffect(() => {
    setIsSubmitted(false);
  }, []);


  const getValidationError = (fieldName: string): string | undefined => {
    return errors.find(error => error.field === fieldName)?.message;
  };


  const updateFormField = (fieldName: string, value: string): void => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));

    if (errors.some(error => error.field === fieldName)) {
      setErrors(prev => prev.filter(error => error.field !== fieldName));
    }
  };

  const sendConfirmationEmail = async (leadData: FormData): Promise<void> => {
    try {
      const { error } = await supabase.functions.invoke('send-confirmation', {
        body: leadData,
      });

      if (error) {
        console.error('Confirmation email delivery failed:', error);
        throw new Error('Email service unavailable');
      }

      console.log('Confirmation email sent successfully');
    } catch (error) {
      console.error('Email function invocation error:', error);
      throw error;
    }
  };

  const handleFormSubmission = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validationErrors = validateLeadForm(formData);
      setErrors(validationErrors);

      if (validationErrors.length === 0) {
        // Send confirmation email
        await sendConfirmationEmail(formData);

        // Create lead record
        const newLeadRecord: LeadRecord = {
          ...formData,
          submitted_at: new Date().toISOString(),
        };

        setLeadRecords(prev => [...prev, newLeadRecord]);
        setIsSubmitted(true);
        setFormData(INITIAL_FORM_STATE);
      }
    } catch (error) {
      console.error('Form submission failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetToNewSubmission = (): void => {
    setIsSubmitted(false);
    setFormData(INITIAL_FORM_STATE);
    setErrors([]);
  };


  const SuccessView = () => (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-gradient-card p-8 rounded-2xl shadow-card border border-border backdrop-blur-sm animate-slide-up text-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto shadow-glow animate-glow">
            <Sparkles className="w-10 h-10 text-primary-foreground" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-foreground mb-3">🎉 You're In!</h2>

        <p className="text-muted-foreground mb-2">
          Welcome to our community! Expect amazing updates coming your way.
        </p>

        <div className="text-sm text-accent mb-8 font-medium">
          Community Member #{leadRecords.length}
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
            <p className="text-sm text-foreground">
              ✨ <strong>What happens next?</strong>
              <br />
              You'll receive exclusive insights, early product access, and insider updates as we
              create something extraordinary together.
            </p>
          </div>

          <Button
            onClick={resetToNewSubmission}
            variant="outline"
            className="w-full border-border hover:bg-accent/10 transition-smooth group"
          >
            <UserPlus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
            Add Another Member
          </Button>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Stay connected - follow our journey for live updates and behind-the-scenes content
          </p>
        </div>
      </div>
    </div>
  );

  /**
   * Renders form input field with validation
   */
  const FormField = ({
    icon: Icon,
    type,
    placeholder,
    value,
    fieldName,
    isSelect = false,
    children
  }: {
    icon: any;
    type?: string;
    placeholder: string;
    value: string;
    fieldName: string;
    isSelect?: boolean;
    children?: React.ReactNode;
  }) => (
    <div className="space-y-2">
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />

        {isSelect ? (
          <Select value={value} onValueChange={(val) => updateFormField(fieldName, val)}>
            <SelectTrigger className={`pl-10 h-12 bg-input border-border text-foreground transition-smooth
              ${getValidationError(fieldName) ? 'border-destructive' : 'focus:border-accent focus:shadow-glow'}
            `}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            {children}
          </Select>
        ) : (
          <Input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={(e) => updateFormField(fieldName, e.target.value)}
            className={`pl-10 h-12 bg-input border-border text-foreground placeholder:text-muted-foreground transition-smooth
              ${getValidationError(fieldName) ? 'border-destructive' : 'focus:border-accent focus:shadow-glow'}
            `}
          />
        )}
      </div>
      {getValidationError(fieldName) && (
        <p className="text-destructive text-sm animate-fade-in">
          {getValidationError(fieldName)}
        </p>
      )}
    </div>
  );

  // Render success view if form was submitted
  if (isSubmitted) {
    return <SuccessView />;
  }

  // Render main form
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-gradient-card p-8 rounded-2xl shadow-card border border-border backdrop-blur-sm animate-slide-up">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
            <Mail className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Join the Innovation Hub
          </h2>
          <p className="text-muted-foreground">
            Get exclusive early access and insider updates
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleFormSubmission} className="space-y-6">
          <FormField
            icon={User}
            type="text"
            placeholder="Enter your full name"
            value={formData.name}
            fieldName="name"
          />

          <FormField
            icon={Mail}
            type="email"
            placeholder="your.email@example.com"
            value={formData.email}
            fieldName="email"
          />

          <FormField
            icon={Building2}
            placeholder="Choose your industry"
            value={formData.industry}
            fieldName="industry"
            isSelect
          >
            <SelectContent>
              {INDUSTRY_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </FormField>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-gradient-primary text-primary-foreground font-semibold rounded-lg shadow-glow hover:shadow-[0_0_60px_hsl(210_100%_60%/0.3)] transition-smooth transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Secure My Early Access
              </>
            )}
          </Button>
        </form>

        {/* Footer */}
        <p className="text-xs text-muted-foreground text-center mt-6">
          By joining, you consent to receive updates and special offers. Opt out anytime.
        </p>
      </div>
    </div>
  );
};