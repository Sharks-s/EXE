import { useEffect, useRef } from "react";

export default function OAuth2CallbackPage() {
  const navigate = useNavigate();
  const { exchangeOAuth } = useAuth();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const minWait = new Promise((resolve) => setTimeout(resolve, 800));

    Promise.all([exchangeOAuth(), minWait])
      .then(() => {
        navigate("/home", { replace: true });
      })
      .catch((err) => {
        console.error("OAuth Exchange Error:", err);
        navigate("/auth", { replace: true });
      });
  }, [exchangeOAuth, navigate]);

  return <FullScreenLoader text="Signing you in..." />;
}

// export default function OAuth2CallbackPage() {
//   const navigate = useNavigate();
//   const { exchangeOAuth } = useAuth();
//   const ranRef = useRef(false);

//   useEffect(() => {
//     if (ranRef.current) return;
//     ranRef.current = true;

//     exchangeOAuth()
//       .then(() => navigate("/home", { replace: true }))
//       .catch(() => navigate("/auth", { replace: true }));
//   }, [exchangeOAuth, navigate]);

//   return null; // 👈 không render gì
// }
