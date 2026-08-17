'use client'

import { motion } from 'framer-motion'
import { BookOpen, Brain, Code, AlertTriangle, Bug, Zap, Rocket, Activity } from 'lucide-react'

const steps = [
  { id: 1, title: 'Learn', description: 'Study the core concepts and theory.', icon: BookOpen, color: 'bg-blue-500' },
  { id: 2, title: 'Understand', description: 'Analyze internal mechanics and tradeoffs.', icon: Brain, color: 'bg-indigo-500' },
  { id: 3, title: 'Implement', description: 'Write raw, standard-compliant code.', icon: Code, color: 'bg-teal-500' },
  { id: 4, title: 'Break', description: 'Push it to the limits under extreme load.', icon: AlertTriangle, color: 'bg-yellow-500' },
  { id: 5, title: 'Debug', description: 'Trace issues across the stack.', icon: Bug, color: 'bg-red-500' },
  { id: 6, title: 'Optimize', description: 'Refactor for scale and performance.', icon: Zap, color: 'bg-orange-500' },
  { id: 7, title: 'Deploy', description: 'Ship securely to a production environment.', icon: Rocket, color: 'bg-purple-500' },
  { id: 8, title: 'Operate', description: 'Monitor, maintain, and scale the system.', icon: Activity, color: 'bg-emerald-500' },
]

export default function PhilosophySection() {
  return (
    <section className="py-24 bg-slate-50 text-slate-900 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Side - Text */}
          <div className="max-w-xl">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6 text-slate-900">
              The Engineering Apprenticeship
            </h2>
            <div className="space-y-6 text-lg text-slate-600">
              <p>
                We don't believe in passive video watching. This is an active engineering apprenticeship designed to transform you from a developer into a senior systems engineer.
              </p>
              <p>
                Our philosophy is simple: <strong className="text-orange-600">you don't understand a system until you've broken it.</strong>
              </p>
              <p>
                Throughout the curriculum, you will follow a rigorous 8-step cycle. You won't just build the happy path; you will subject your APIs to massive load, induce race conditions, simulate network partitions, and learn how to engineer resilient solutions.
              </p>
            </div>
          </div>

          {/* Right Side - Flow Diagram */}
          <div className="relative py-8">
            <div className="absolute left-8 md:left-1/2 top-10 bottom-10 w-1 bg-slate-200 rounded-full transform md:-translate-x-1/2">
              <motion.div 
                className="w-full bg-orange-500 rounded-full"
                animate={{ height: ['0%', '100%'] }}
                transition={{ duration: 4, ease: "linear", repeat: Infinity }}
              />
            </div>

            <div className="space-y-6">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isEven = index % 2 === 0;
                
                return (
                  <motion.div 
                    key={step.id}
                    initial={{ opacity: 0, x: isEven ? -20 : 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className={`relative flex items-center gap-6 ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} flex-row`}
                  >
                    {/* Number / Icon */}
                    <div className={`relative z-10 w-16 h-16 rounded-full border-4 border-slate-50 ${step.color} flex items-center justify-center text-white shadow-lg shrink-0 md:absolute md:left-1/2 md:transform md:-translate-x-1/2`}>
                      <Icon className="w-6 h-6" />
                    </div>

                    {/* Content Box */}
                    <div className={`bg-white border border-slate-200 shadow-sm rounded-xl p-5 flex-1 md:w-[calc(50%-3rem)] ${isEven ? 'md:mr-auto' : 'md:ml-auto md:text-right'} hover:border-orange-500 transition-colors`}>
                      <div className="text-orange-600 font-mono text-sm font-bold mb-1">Step 0{step.id}</div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed">{step.description}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
          
        </div>
      </div>
    </section>
  )
}
