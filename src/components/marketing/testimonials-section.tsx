'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  avatar?: string;
}

// These can be replaced with real testimonials as they come in
const testimonials: Testimonial[] = [
  {
    quote: "Finally ditched our 15-tab spreadsheet monster. Booth just works the way I think about trade shows.",
    author: "Sarah M.",
    role: "Marketing Director",
    company: "FinTech Startup",
  },
  {
    quote: "The budget tracking alone saved us $12K last year by catching overbilling. Pays for itself.",
    author: "Mike T.",
    role: "Events Manager",
    company: "Enterprise SaaS",
  },
  {
    quote: "My team actually uses it. That's the highest praise I can give any tool.",
    author: "Jessica L.",
    role: "VP Marketing",
    company: "Healthcare Tech",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-text-primary"
          >
            Built by practitioners, loved by teams
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-text-secondary max-w-2xl mx-auto"
          >
            Booth was built by someone who&apos;s been in the trenches. Here&apos;s what people are saying.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative bg-surface rounded-2xl border border-border p-6"
            >
              <Quote size={24} className="text-brand-purple/20 absolute top-4 right-4" />
              
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={14} className="fill-warning text-warning" />
                ))}
              </div>

              <p className="text-text-primary mb-6 leading-relaxed">
                &quot;{testimonial.quote}&quot;
              </p>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-purple to-brand-purple-dark flex items-center justify-center text-white font-semibold">
                  {testimonial.author[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{testimonial.author}</p>
                  <p className="text-xs text-text-tertiary">{testimonial.role} at {testimonial.company}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
