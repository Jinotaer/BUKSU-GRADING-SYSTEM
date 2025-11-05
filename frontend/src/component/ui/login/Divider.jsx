import PropTypes from "prop-types";

export default function Divider({ text = "or" }) {
  return (
    <div
      style={{ display: "flex", alignItems: "center", margin: "24px 0" }}
    >
      <div style={{ flex: 1, height: 1, background: "#e0e0e0" }} />
      <span style={{ margin: "0 12px", color: "#888", fontSize: 14 }}>
        {text}
      </span>
      <div style={{ flex: 1, height: 1, background: "#e0e0e0" }} />
    </div>
  );
}

Divider.propTypes = {
  text: PropTypes.string,
};
