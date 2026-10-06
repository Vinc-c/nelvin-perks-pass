import * as React from "react"

// Neutral placeholder shown when an image is missing or fails to load.
const FALLBACK_IMAGE_URL = "/images/placeholder.svg"

/**
 * Plain <img> with lazy loading and a graceful fallback when the source is
 * empty or broken. `fittingType` is kept for API compatibility: "fit" maps to
 * object-contain, anything else to object-cover (only when the caller hasn't
 * set an object-* class itself).
 */
const Image = React.forwardRef(
  (
    {
      src,
      fittingType = "fill",
      // Accepted for backwards compatibility; no longer used.
      originWidth: _originWidth,
      originHeight: _originHeight,
      focalPointX: _focalPointX,
      focalPointY: _focalPointY,
      quality: _quality,
      onError,
      className,
      loading = "lazy",
      ...props
    },
    ref
  ) => {
    const [failedSrc, setFailedSrc] = React.useState(null)
    const broken = !src || failedSrc === src
    const fitClass = className && /\bobject-/.test(className)
      ? ""
      : fittingType === "fit" ? " object-contain" : " object-cover"

    return (
      <img
        ref={ref}
        src={broken ? FALLBACK_IMAGE_URL : src}
        loading={loading}
        decoding="async"
        className={`${className || ""}${fitClass}`.trim()}
        onError={(event) => {
          if (broken) return
          setFailedSrc(src)
          onError?.(event)
        }}
        data-error-image={broken || undefined}
        {...props}
      />
    )
  }
)
Image.displayName = "Image"

export { Image }
