import React, { useState } from "react";
import {
  ServiceBadge,
  CopyIcon,
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  EditIcon,
  TrashIcon,
  LockIcon,
  StarIcon,
  GlobeIcon,
  FileTextIcon,
} from "./Icons";

export default function CredentialCard({
  credential,
  isRevealed,
  onToggleReveal,
  onToggleFavorite,
  onEdit,
  onDelete,
  onCopy,
}) {
  const [copiedField, setCopiedField] = useState(null);
  const [showNotes, setShowNotes] = useState(false);

  const handleCopy = (field, text) => {
    if (!text) return;
    onCopy(text);
    setCopiedField(field);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const isNote = credential.credentialType === "SECURE_NOTE";

  return (
    <div className="credential-card">
      <div>
        {/* Top Header */}
        <div className="card-top">
          <div className="card-service-info">
            <ServiceBadge title={credential.title} credentialType={credential.credentialType} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <h3 className="card-title-text">{credential.title}</h3>
                {credential.url && (
                  <a
                    href={credential.url.startsWith("http") ? credential.url : `https://${credential.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Open ${credential.url}`}
                    style={{ color: "var(--text-muted)", display: "flex", alignItems: "center" }}
                  >
                    <GlobeIcon size={14} />
                  </a>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                {credential.credentialType && credential.credentialType !== "LOGIN" && (
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: "700",
                      padding: "1px 6px",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--accent-glow)",
                      color: "var(--accent-cyan)",
                    }}
                  >
                    {credential.credentialType.replace("_", " ")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Favorite Toggle Star */}
          <button
            type="button"
            className="btn-icon"
            style={{ width: "32px", height: "32px" }}
            onClick={() => onToggleFavorite && onToggleFavorite(credential.id)}
            title={credential.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          >
            <StarIcon size={18} filled={!!credential.isFavorite} />
          </button>
        </div>

        {/* Card Body with Username, Password & Notes */}
        <div className="card-body">
          {/* Username Box (if present and not a pure secure note) */}
          {credential.username && (
            <div className="credential-field-box">
              <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                <div className="field-label">Username / Identity</div>
                <div className="field-value mono-text" title={credential.username}>
                  {credential.username}
                </div>
              </div>
              <div className="field-actions">
                <button
                  type="button"
                  className="btn-copy-action"
                  onClick={() => handleCopy("username", credential.username)}
                  title="Copy Username"
                >
                  {copiedField === "username" ? (
                    <>
                      <CheckIcon size={14} style={{ color: "var(--success)" }} />
                      <span style={{ color: "var(--success)" }}>Copied</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon size={14} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Password Box (if not pure note) */}
          {!isNote && (
            <div className="credential-field-box">
              <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                <div className="field-label">Password</div>
                <div
                  className="field-value mono-text"
                  style={{
                    letterSpacing: isRevealed ? "normal" : "0.2em",
                    fontSize: isRevealed ? "13.5px" : "16px",
                    userSelect: isRevealed ? "all" : "none",
                  }}
                >
                  {isRevealed ? credential.password : "••••••••••••"}
                </div>
              </div>

              <div className="field-actions">
                <button
                  type="button"
                  className="btn-copy-action"
                  onClick={onToggleReveal}
                  title={isRevealed ? "Hide Password" : "Show Password"}
                >
                  {isRevealed ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
                  <span>{isRevealed ? "Hide" : "Show"}</span>
                </button>

                <button
                  type="button"
                  className="btn-copy-action"
                  onClick={() => handleCopy("password", credential.password)}
                  title="Copy Password"
                >
                  {copiedField === "password" ? (
                    <>
                      <CheckIcon size={14} style={{ color: "var(--success)" }} />
                      <span style={{ color: "var(--success)" }}>Copied</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon size={14} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Encrypted Notes Content */}
          {credential.notes && (
            <div
              style={{
                background: "var(--bg-surface-raised)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "10px 12px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <div className="field-label" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <FileTextIcon size={12} /> Encrypted Note
                </div>
                <button
                  type="button"
                  className="link-button"
                  style={{ fontSize: "11.5px" }}
                  onClick={() => setShowNotes(!showNotes)}
                >
                  {showNotes ? "Collapse" : "Expand"}
                </button>
              </div>
              {showNotes ? (
                <div
                  className="mono-text"
                  style={{
                    fontSize: "12.5px",
                    color: "var(--text-primary)",
                    whiteSpace: "pre-wrap",
                    maxHeight: "140px",
                    overflowY: "auto",
                  }}
                >
                  {credential.notes}
                </div>
              ) : (
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  {credential.notes.length} characters (AES-256 encrypted)
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="card-footer-actions">
        <span style={{ fontSize: "11px", color: "var(--text-muted)", marginRight: "auto" }}>
          🔒 AES-256 GCM
        </span>

        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: "6px 12px", fontSize: "12.5px" }}
          onClick={() => onEdit(credential)}
        >
          <EditIcon size={14} />
          <span>Edit</span>
        </button>

        <button
          type="button"
          className="btn btn-danger"
          style={{ padding: "6px 12px", fontSize: "12.5px" }}
          onClick={() => onDelete(credential.id)}
        >
          <TrashIcon size={14} />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
}
