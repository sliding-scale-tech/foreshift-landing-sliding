import { useRef, useState } from 'react'
import { WF_PAGE_IDS } from '../../config/site'

// "Get ahead of next week" early-access form (Webflow `w-form`).
// The export has no `action`, so Webflow would post to its hosted form API. Here submission is simulated
// as a success and the UI mirrors Webflow's forms module: form -> display:none, .w-form-done -> display:block
// and focused. The original page's custom script also pushes a GTM dataLayer event on submit.

const FORM_NAME = 'Contact Form'

const FIELDS = [
  { id: 'Email', dataName: 'Email', type: 'email', label: 'Work Email' },
  { id: 'Phone-Number', dataName: 'Phone Number', type: 'tel', label: 'Your city' },
  {
    id: 'Company-Name',
    dataName: 'Company Name',
    type: 'text',
    label: (
      <>
        Restaurant Name <span className="text-span-54">(optional)</span>
      </>
    ),
  },
]

export default function EarlyAccessForm() {
  const [submitted, setSubmitted] = useState(false)
  const doneRef = useRef(null)

  const handleSubmit = (event) => {
    event.preventDefault()
    const form = event.currentTarget
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({
      event: 'form_submission_success',
      form_id: form.id || 'webflow-form-no-id-0',
      form_type: 'webflow-native',
    })
    setSubmitted(true)
    // Webflow focuses the success region once it is shown.
    requestAnimationFrame(() => doneRef.current?.focus())
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
            method="get"
            className="f-contact-form"
            data-wf-page-id={WF_PAGE_IDS.home}
            data-wf-element-id="49fb6418-a641-4c94-311e-ab86aa7bb7a7"
            aria-label={FORM_NAME}
            onSubmit={handleSubmit}
            style={submitted ? { display: 'none' } : undefined}
          >
            {FIELDS.map(({ id, dataName, type, label }) => (
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
                  required
                />
              </div>
            ))}
            <input type="submit" data-wait="Submitting..." className="f-button-neutral-2 w-button" value="Get early access" />
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
            className="w-form-fail"
            tabIndex={-1}
            role="region"
            aria-label={`${FORM_NAME} failure`}
            style={submitted ? { display: 'none' } : undefined}
          >
            <div>Oops! Something went wrong while submitting the form.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
