import { MarketingLayout } from "@/components/marketing-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqCategories = [
  {
    category: "Getting Started",
    questions: [
      {
        question: "How long does it take to set up EtherAI-Dental?",
        answer: "Most practices are up and running within 24-48 hours. The initial setup involves registering your practice, configuring your settings, and optionally connecting your Dentrix Ascend account. Our onboarding team guides you through every step.",
      },
      {
        question: "Do I need to install any software?",
        answer: "No installation required. EtherAI-Dental is a cloud-based platform accessible from any modern web browser. This means your team can access it from any device, anywhere with an internet connection.",
      },
      {
        question: "Can I import my existing patient data?",
        answer: "Yes! You can import patients via CSV file or sync automatically with Dentrix Ascend. Our CSV import handles various formats and includes duplicate detection to prevent data issues.",
      },
    ],
  },
  {
    category: "Insurance Verification",
    questions: [
      {
        question: "Which insurance carriers do you support?",
        answer: "We support verification through DentalXchange for dental insurance and Availity for medical insurance, which together cover the vast majority of major carriers including Delta Dental, MetLife, Cigna, Aetna, United Healthcare, and hundreds more.",
      },
      {
        question: "How accurate is the verification data?",
        answer: "Our verification data comes directly from the insurance carriers through official clearinghouse connections. The accuracy matches what you would receive by calling the carrier directly, but delivered in seconds instead of minutes.",
      },
      {
        question: "Can I verify both dental and medical insurance?",
        answer: "Yes, EtherAI-Dental supports dual-insurance verification. This is especially useful for procedures that may have medical coverage components, like TMJ treatment or oral surgery.",
      },
    ],
  },
  {
    category: "Billing & Payments",
    questions: [
      {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards (Visa, MasterCard, American Express, Discover) and can set up ACH bank transfers for annual plans. All payments are processed securely through Stripe.",
      },
      {
        question: "Can I change my plan later?",
        answer: "Absolutely. You can upgrade or downgrade your plan at any time. When upgrading, the change takes effect immediately and you're billed prorated. When downgrading, the change takes effect at your next billing cycle.",
      },
      {
        question: "Is there a contract or commitment?",
        answer: "No long-term contracts required. All plans are month-to-month and you can cancel at any time. We do offer discounted annual plans for practices that prefer to pay upfront.",
      },
    ],
  },
  {
    category: "Security & Compliance",
    questions: [
      {
        question: "Is EtherAI-Dental HIPAA compliant?",
        answer: "Yes, EtherAI-Dental is fully HIPAA compliant. We implement all required administrative, physical, and technical safeguards. We also sign Business Associate Agreements (BAAs) with all customers.",
      },
      {
        question: "How is my data protected?",
        answer: "All data is encrypted both in transit (TLS 1.3) and at rest (AES-256). We use enterprise-grade cloud infrastructure with regular security audits, and our systems are SOC 2 Type II certified.",
      },
      {
        question: "Who has access to patient information?",
        answer: "Only authorized users from your practice can access patient data. Our staff never accesses patient information except when explicitly requested for technical support, and all access is logged and audited.",
      },
    ],
  },
  {
    category: "Support & Training",
    questions: [
      {
        question: "What support options are available?",
        answer: "All plans include email support with response within 24 hours. Professional and Enterprise plans include priority support with faster response times, and Enterprise includes a dedicated account manager.",
      },
      {
        question: "Do you provide training?",
        answer: "Yes, we provide complimentary onboarding training for all new accounts. This includes live video sessions, recorded tutorials, and comprehensive documentation. Additional training sessions are available upon request.",
      },
      {
        question: "What if I need help outside business hours?",
        answer: "Our knowledge base and documentation are available 24/7. For Enterprise customers, we offer extended support hours and emergency contact options for critical issues.",
      },
    ],
  },
];

export default function FAQ() {
  return (
    <MarketingLayout>
      <section className="py-16 lg:py-24" data-testid="section-faq">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6" data-testid="text-faq-title">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-muted-foreground" data-testid="text-faq-description">
              Find answers to common questions about EtherAI-Dental. Can't find what you're 
              looking for? Contact our support team.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8" data-testid="faq-container">
            {faqCategories.map((category, catIndex) => (
              <Card key={catIndex} data-testid={`faq-category-${catIndex}`}>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">{category.category}</h2>
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((item, qIndex) => (
                      <AccordionItem
                        key={qIndex}
                        value={`${catIndex}-${qIndex}`}
                        data-testid={`faq-item-${catIndex}-${qIndex}`}
                      >
                        <AccordionTrigger className="text-left" data-testid={`button-faq-trigger-${catIndex}-${qIndex}`}>
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground" data-testid={`text-faq-answer-${catIndex}-${qIndex}`}>
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-16 space-y-4">
            <p className="text-lg text-muted-foreground">
              Still have questions?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo">
                <Button size="lg" data-testid="button-contact-support">
                  Contact Support
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline" data-testid="button-schedule-call">
                  Schedule a Call
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
