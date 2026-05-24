export const sendWablasMessage = async (
  phone: string, 
  message: string, 
  branchName?: string
) => {
  // Default to Main Branch (KTS)
  let domain = process.env.WABLAS_DOMAIN || process.env.WABLAS_DOMAIN_KARTASURA;
  let token = process.env.WABLAS_TOKEN || process.env.WABLAS_TOKEN_KARTASURA;

  // Aggressive check for Serengan (Cabang 2)
  if (branchName) {
    const cleanBranch = branchName.toUpperCase().trim();
    if (
      cleanBranch.includes('CABANG_2') || 
      cleanBranch.includes('CABANG2') || 
      cleanBranch === 'CABANG 2' || 
      cleanBranch === '2' || 
      cleanBranch.includes('SRE') || 
      cleanBranch.includes('SERENGAN')
    ) {
      // Override with Serengan credentials
      domain = process.env.WABLAS_DOMAIN_CABANG2 || domain;
      token = process.env.WABLAS_TOKEN_CABANG2 || token;
    }
  }

  if (!domain || !token) {
    console.error("Wablas credentials are missing!");
    return false;
  }

  try {
    const res = await fetch(`${domain}/api/send-message`, {
      method: "POST",
      headers: {
        "Authorization": token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ phone, message })
    });
    
    return res.ok;
  } catch (error) {
    console.error(`Gagal mengirim balasan Wablas untuk ${branchName || 'default'}:`, error);
    return false;
  }
};
