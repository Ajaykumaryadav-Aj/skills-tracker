import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MetricCard from '../MetricCard'
import { Activity } from 'lucide-react'
import React from 'react'

describe('MetricCard', () => {
  it('renders label and value correctly', () => {
    render(
      <MetricCard
        label="Test Label"
        value="42"
        detail="Test Detail"
        icon={Activity}
      />
    )
    expect(screen.getByText('Test Label')).toBeDefined()
    expect(screen.getByText('42')).toBeDefined()
    expect(screen.getByText('Test Detail')).toBeDefined()
  })
})
