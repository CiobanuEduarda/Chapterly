import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, renderHook, act, waitFor } from '@testing-library/react'
import { ToastProvider, useToast, ToastContainer, type Toast } from './toastContext'
import userEvent from '@testing-library/user-event'

// Wrapper component for testing hooks
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>{children}</ToastProvider>
)

describe('ToastContext', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should show and hide toasts', async () => {
    const { result } = renderHook(() => useToast(), { wrapper })

    // Initially no toasts
    expect(result.current.toasts).toHaveLength(0)

    // Show a toast
    act(() => {
      result.current.showToast('Test message', 'success')
    })

    expect(result.current.toasts).toHaveLength(1)
    const toast = result.current.toasts[0] as Toast
    expect(toast).toMatchObject({
      message: 'Test message',
      type: 'success'
    })

    // Hide the toast
    act(() => {
      result.current.hideToast(toast.id)
    })

    expect(result.current.toasts).toHaveLength(0)
  })

  it('should automatically remove toasts after 3 seconds', async () => {
    const { result } = renderHook(() => useToast(), { wrapper })

    act(() => {
      result.current.showToast('Test message', 'success')
    })

    expect(result.current.toasts).toHaveLength(1)

    // Fast-forward 3 seconds
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(result.current.toasts).toHaveLength(0)
  })

  it('should handle multiple toasts', () => {
    const { result } = renderHook(() => useToast(), { wrapper })

    act(() => {
      result.current.showToast('Success message', 'success')
      result.current.showToast('Error message', 'error')
      result.current.showToast('Info message', 'info')
    })

    expect(result.current.toasts).toHaveLength(3)
    const [successToast, errorToast, infoToast] = result.current.toasts as Toast[]
    expect(successToast?.type).toBe('success')
    expect(errorToast?.type).toBe('error')
    expect(infoToast?.type).toBe('info')
  })

  it('should render ToastContainer with correct styles', () => {
    const { result } = renderHook(() => useToast(), { wrapper })

    act(() => {
      result.current.showToast('Success message', 'success')
      result.current.showToast('Error message', 'error')
      result.current.showToast('Info message', 'info')
    })

    const { container } = render(<ToastContainer />, { wrapper: ToastProvider })

    // Check if toasts are rendered with correct styles
    const successToast = container.querySelector('.bg-\\[\\#52796F\\]')
    const errorToast = container.querySelector('.bg-\\[\\#C76E77\\]')
    const infoToast = container.querySelector('.bg-\\[\\#A1AD92\\]')

    expect(successToast).toBeDefined()
    expect(errorToast).toBeDefined()
    expect(infoToast).toBeDefined()
  })

  it('should throw error when useToast is used outside ToastProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      renderHook(() => useToast())
    }).toThrow('useToast must be used within a ToastProvider')

    consoleError.mockRestore()
  })

  it('should not render ToastContainer when there are no toasts', () => {
    const { container } = render(<ToastContainer />, { wrapper: ToastProvider })
    expect(container.firstChild).toBeNull()
  })

  it('should not render ToastContainer when context is undefined', () => {
    const { container } = render(<ToastContainer />)
    expect(container.firstChild).toBeNull()
  })
}) 