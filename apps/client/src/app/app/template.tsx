'use client'
/**
 * @module client-shell @owner CLIENT — soft page-enter fade for every /app route.
 * Opacity only: a transform/filter on this wrapper would turn every `position: fixed` child (CTA bars, sheets, FABs)
 * into page-relative positioning. Section-level motion lives inside pages (Reveal/Item).
 */
import { motion } from 'motion/react'

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  )
}
