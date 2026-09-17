import { useRef, useState } from 'react'
import { WF_PAGE_IDS } from '../../config/site'

// "Get ahead of next week" early-access form (Webflow `w-form`).
// Posts to /api/early-access, which emails anthony@foreshift.ai via Resend.
// UI mirrors Webflow's forms module: success hides the form and shows .w-form-done;
// failure keeps the form and shows .w-form-fail.

const FORM_NAME = 'Contact Form'

const FIELDS = [
  { id: 'Email', dataName: 'Email', type: 'email', label: 'Work Email', required: true },
  { id: 'Phone-Number', dataName: 'Phone Number', type: 'tel', label: 'Your city', required: true },
  {
    id: 'Company-Name',
    dataName: 'Company Name',
    type: 'text',
    label: (
      <>
        Restaurant Name <span className="text-span-54">(optional)</span>
      </>
    ),
    required: false,
  },
]

export default function EarlyAccessForm() {
  const [status, setStatus] = useState('idle')
  const doneRef = useRef(null)
  const failRef = useRef(null)
  const submitted = status === 'success'

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (status === 'submitting') return
    const form = event.currentTarget
    const payload = {
      email: form.Email.value.trim(),
      city: form['Phone-Number'].value.trim(),
      restaurantName: form['Company-Name'].value.trim(),
    }
    setStatus('submitting')
    try {
      const response = await fetch('/api/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error('submit failed')
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({
        event: 'form_submission_success',
        form_id: form.id || 'webflow-form-no-id-0',
        form_type: 'webflow-native',
      })
      setStatus('success')
      requestAnimationFrame(() => doneRef.current?.focus())
    } catch {
      setStatus('error')
      requestAnimationFrame(() => failRef.current?.focus())
    }
  }

  return (
    <div id="Form" className="f-section-large-3">
      <div className="f-contact-content">
        <div className="f-margin-bottom-68">
          <div className="f-title-wrapper-center-2">
            <div className="f-margin-bottom-67">
              <h1 className="f-h3-heading-3">
                Get ahead of next <span className="text-span-11">week</span>
              </h1>
            </div>
            <p className="f-paragraph-large-3">
              ForeShift is live in Detroit and opening more markets next. Tell us where you operate and we&#x27;ll get
              you in, or put your city on the list.
            </p>
          </div>
        </div>
        <div className="form-block w-form">
          <form
            id="wf-form-Contact-Form-2"
            name="wf-form-Contact-Form-2"
            data-name={FORM_NAME}
            method="post"
            action="/api/early-access"
            className="f-contact-form"
            data-wf-page-id={WF_PAGE_IDS.home}
            data-wf-element-id="49fb6418-a641-4c94-311e-ab86aa7bb7a7"
            aria-label={FORM_NAME}
            onSubmit={handleSubmit}
            style={submitted ? { display: 'none' } : undefined}
          >
            {FIELDS.map(({ id, dataName, type, label, required }) => (
              <div key={id} className="f-margin-bottom-67">
                <label htmlFor={id} className="f-field-label">
                  {label}
                </label>
                <input
                  className="f-field-input w-input"
                  maxLength={256}
                  name={id}
                  data-name={dataName}
                  placeholder=""
                  type={type}
                  id={id}
                  required={required}
                  disabled={status === 'submitting'}
                />
              </div>
            ))}
            <button
              type="submit"
              data-wait="Submitting..."
              className="f-button-neutral-2 w-button"
              disabled={status === 'submitting'}
            >
              {status === 'submitting' ? 'Submitting...' : 'Get early access'}
            </button>
          </form>
          <div
            ref={doneRef}
            className="success-message w-form-done"
            tabIndex={-1}
            role="region"
            aria-label={`${FORM_NAME} success`}
            style={submitted ? { display: 'block' } : undefined}
          >
            <div className="text-block-12">Thank you! Your submission has been received!</div>
          </div>
          <div
            ref={failRef}
            className="w-form-fail"
            tabIndex={-1}
            role="region"
            aria-label={`${FORM_NAME} failure`}
            style={status === 'error' ? { display: 'block' } : undefined}
          >
            <div>Oops! Something went wrong while submitting the form.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
