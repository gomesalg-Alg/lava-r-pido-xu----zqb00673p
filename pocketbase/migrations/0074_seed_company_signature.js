migrate(
  (app) => {
    try {
      const company = app.findFirstRecordByFilter('company', "id != ''")
      if (company && !company.get('signature')) {
        // Set default signature filename if uploaded via app or fallback
      }
    } catch (err) {
      console.log('Error seeding company signature:', err)
    }
  },
  (app) => {},
)
