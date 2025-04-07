# database/seed_data/nutrients.py

# List to hold all nutrient dictionaries for seeding
seed_nutrients = [
    # --- General ---
    {
        "nutrient_name": "Energy", "nutrient_symbol": "ENERC_KCAL", "unit": "kcal", "nutrient_decimals": 0,
        "primary_group": "General", "secondary_group": None, "tertiary_group": None, "quaternary_group": None, "sort_order": 1,
    },
    {
        "nutrient_name": "Water", "nutrient_symbol": "WATER", "unit": "g", "nutrient_decimals": 1,
        "primary_group": "General", "secondary_group": None, "tertiary_group": None, "quaternary_group": None, "sort_order": 5,
    },
    # --- Macronutrients ---
    # ** Carbohydrates **
    {
        "nutrient_name": "Carbohydrate, total", "nutrient_symbol": "CHOCDF", "unit": "g", "nutrient_decimals": 1,
        "primary_group": "Macronutrient", "secondary_group": "Carbohydrate", "tertiary_group": None, "quaternary_group": None, "sort_order": 10,
    },
    {
        "nutrient_name": "Fiber, total dietary", "nutrient_symbol": "FIBTG", "unit": "g", "nutrient_decimals": 1,
        "primary_group": "Macronutrient", "secondary_group": "Fiber", "tertiary_group": None, "quaternary_group": None, "sort_order": 15,
    },
    {
        "nutrient_name": "Pectin", "nutrient_symbol": None, "unit": "g", "nutrient_decimals": 1,
        "primary_group": "Macronutrient", "secondary_group": "Fiber", "tertiary_group": "Soluble Fiber", "quaternary_group": "Pectin", "sort_order": 17,
    },
    {
        "nutrient_name": "Beta-Glucans", "nutrient_symbol": None, "unit": "g", "nutrient_decimals": 1,
        "primary_group": "Macronutrient", "secondary_group": "Fiber", "tertiary_group": "Soluble Fiber", "quaternary_group": "Beta-Glucan", "sort_order": 18,
    },
    {
        "nutrient_name": "Inulin", "nutrient_symbol": None, "unit": "g", "nutrient_decimals": 1,
        "primary_group": "Macronutrient", "secondary_group": "Fiber", "tertiary_group": "Soluble Fiber", "quaternary_group": "Inulin", "sort_order": 19,
    },
    {
        "nutrient_name": "Resistant Starch", "nutrient_symbol": None, "unit": "g", "nutrient_decimals": 1,
        "primary_group": "Macronutrient", "secondary_group": "Fiber", "tertiary_group": "Soluble Fiber", "quaternary_group": "Resistant Starch", "sort_order": 20,
    },
    {
        "nutrient_name": "Cellulose", "nutrient_symbol": None, "unit": "g", "nutrient_decimals": 1,
        "primary_group": "Macronutrient", "secondary_group": "Fiber", "tertiary_group": "Insoluble Fiber", "quaternary_group": "Cellulose", "sort_order": 22,
    },
    {
        "nutrient_name": "Hemicellulose", "nutrient_symbol": None, "unit": "g", "nutrient_decimals": 1,
        "primary_group": "Macronutrient", "secondary_group": "Fiber", "tertiary_group": "Insoluble Fiber", "quaternary_group": "Hemicellulose", "sort_order": 23,
    },
    {
        "nutrient_name": "Lignin", "nutrient_symbol": None, "unit": "g", "nutrient_decimals": 1,
        "primary_group": "Macronutrient", "secondary_group": "Fiber", "tertiary_group": "Insoluble Fiber", "quaternary_group": "Lignin", "sort_order": 24,
    },
    {
        "nutrient_name": "Sugars, total", "nutrient_symbol": "SUGAR", "unit": "g", "nutrient_decimals": 1,
        "primary_group": "Macronutrient", "secondary_group": "Carbohydrate", "tertiary_group": "Total Sugars", "quaternary_group": None, "sort_order": 25,
    },
    {
        "nutrient_name": "Glucose", "nutrient_symbol": "GLUS", "unit": "g", "nutrient_decimals": 1,
        "primary_group": "Macronutrient", "secondary_group": "Carbohydrate", "tertiary_group": "Simple Sugar", "quaternary_group": "Monosaccharide", "sort_order": 26,
    },
    {
        "nutrient_name": "Fructose", "nutrient_symbol": "FRUS", "unit": "g", "nutrient_decimals": 1,
        "primary_group": "Macronutrient", "secondary_group": "Carbohydrate", "tertiary_group": "Simple Sugar", "quaternary_group": "Monosaccharide", "sort_order": 27,
    },
    {
        "nutrient_name": "Galactose", "nutrient_symbol": "GALS", "unit": "g", "nutrient_decimals": 1,
        "primary_group": "Macronutrient", "secondary_group": "Carbohydrate", "tertiary_group": "Simple Sugar", "quaternary_group": "Monosaccharide", "sort_order": 28,
    },
    {
        "nutrient_name": "Sucrose", "nutrient_symbol": "SUCS", "unit": "g", "nutrient_decimals": 1,
        "primary_group": "Macronutrient", "secondary_group": "Carbohydrate", "tertiary_group": "Simple Sugar", "quaternary_group": "Disaccharide", "sort_order": 29,
    },
    {
        "nutrient_name": "Lactose", "nutrient_symbol": "LACS", "unit": "g", "nutrient_decimals": 1,
        "primary_group": "Macronutrient", "secondary_group": "Carbohydrate", "tertiary_group": "Simple Sugar", "quaternary_group": "Disaccharide", "sort_order": 30,
    },
    {
        "nutrient_name": "Maltose", "nutrient_symbol": "MALS", "unit": "g", "nutrient_decimals": 1,
        "primary_group": "Macronutrient", "secondary_group": "Carbohydrate", "tertiary_group": "Simple Sugar", "quaternary_group": "Disaccharide", "sort_order": 31,
    },
    {
        "nutrient_name": "Starch", "nutrient_symbol": "STARCH", "unit": "g", "nutrient_decimals": 1,
        "primary_group": "Macronutrient", "secondary_group": "Carbohydrate", "tertiary_group": "Complex Carbohydrate", "quaternary_group": "Starch", "sort_order": 35,
    },
    {
        "nutrient_name": "Amylose", "nutrient_symbol": None, "unit": "g", "nutrient_decimals": 1,
        "primary_group": "Macronutrient", "secondary_group": "Carbohydrate", "tertiary_group": "Complex Carbohydrate", "quaternary_group": "Starch Component", "sort_order": 36,
    },
    {
        "nutrient_name": "Amylopectin", "nutrient_symbol": None, "unit": "g", "nutrient_decimals": 1,
        "primary_group": "Macronutrient", "secondary_group": "Carbohydrate", "tertiary_group": "Complex Carbohydrate", "quaternary_group": "Starch Component", "sort_order": 37,
    },
    {
        "nutrient_name": "Glycogen", "nutrient_symbol": None, "unit": "g", "nutrient_decimals": 1,
        "primary_group": "Macronutrient", "secondary_group": "Carbohydrate", "tertiary_group": "Complex Carbohydrate", "quaternary_group": "Glycogen", "sort_order": 38,
    },
    {
        "nutrient_name": "Raffinose", "nutrient_symbol": None, "unit": "g", "nutrient_decimals": 2,
        "primary_group": "Macronutrient", "secondary_group": "Carbohydrate", "tertiary_group": "Oligosaccharide", "quaternary_group": "Raffinose Family", "sort_order": 40,
    },
    {
        "nutrient_name": "Stachyose", "nutrient_symbol": None, "unit": "g", "nutrient_decimals": 2,
        "primary_group": "Macronutrient", "secondary_group": "Carbohydrate", "tertiary_group": "Oligosaccharide", "quaternary_group": "Raffinose Family", "sort_order": 41,
    },
    {
        "nutrient_name": "Verbascose", "nutrient_symbol": None, "unit": "g", "nutrient_decimals": 2,
        "primary_group": "Macronutrient", "secondary_group": "Carbohydrate", "tertiary_group": "Oligosaccharide", "quaternary_group": "Raffinose Family", "sort_order": 42,
    },
    {
        "nutrient_name": "Fructooligosaccharides (FOS)", "nutrient_symbol": "FOS", "unit": "g", "nutrient_decimals": 1,
        "primary_group": "Macronutrient", "secondary_group": "Carbohydrate", "tertiary_group": "Oligosaccharide", "quaternary_group": "Fructan", "sort_order": 43,
    },
    {
        "nutrient_name": "Galactooligosaccharides (GOS)", "nutrient_symbol": "GOS", "unit": "g", "nutrient_decimals": 1,
        "primary_group": "Macronutrient", "secondary_group": "Carbohydrate", "tertiary_group": "Oligosaccharide", "quaternary_group": "Galactan", "sort_order": 44,
    },
    {
        "nutrient_name": "Sorbitol", "nutrient_symbol": None, "unit": "g", "nutrient_decimals": 1,
        "primary_group": "Macronutrient", "secondary_group": "Sugar Alcohol", "tertiary_group": None, "quaternary_group": None, "sort_order": 50,
    },
    {
        "nutrient_name": "Mannitol", "nutrient_symbol": None, "unit": "g", "nutrient_decimals": 1,
        "primary_group": "Macronutrient", "secondary_group": "Sugar Alcohol", "tertiary_group": None, "quaternary_group": None, "sort_order": 51,
    },
    {
        "nutrient_name": "Xylitol", "nutrient_symbol": None, "unit": "g", "nutrient_decimals": 1,
        "primary_group": "Macronutrient", "secondary_group": "Sugar Alcohol", "tertiary_group": None, "quaternary_group": None, "sort_order": 52,
    },
    {
        "nutrient_name": "Erythritol", "nutrient_symbol": None, "unit": "g", "nutrient_decimals": 1,
        "primary_group": "Macronutrient", "secondary_group": "Sugar Alcohol", "tertiary_group": None, "quaternary_group": None, "sort_order": 53,
    },
    {
        "nutrient_name": "Maltitol", "nutrient_symbol": None, "unit": "g", "nutrient_decimals": 1,
        "primary_group": "Macronutrient", "secondary_group": "Sugar Alcohol", "tertiary_group": None, "quaternary_group": None, "sort_order": 54,
    },
    {
        "nutrient_name": "Isomalt", "nutrient_symbol": None, "unit": "g", "nutrient_decimals": 1,
        "primary_group": "Macronutrient", "secondary_group": "Sugar Alcohol", "tertiary_group": None, "quaternary_group": None, "sort_order": 55,
    },
    {
        "nutrient_name": "Lactitol", "nutrient_symbol": None, "unit": "g", "nutrient_decimals": 1,
        "primary_group": "Macronutrient", "secondary_group": "Sugar Alcohol", "tertiary_group": None, "quaternary_group": None, "sort_order": 56,
    },
    # ** Protein **
    {
        "nutrient_name": "Protein, total", "nutrient_symbol": "PROCNT", "unit": "g", "nutrient_decimals": 1,
        "primary_group": "Macronutrient", "secondary_group": "Protein", "tertiary_group": None, "quaternary_group": None, "sort_order": 100,
    },
    { "nutrient_name": "Histidine", "nutrient_symbol": "HISTD", "unit": "g", "nutrient_decimals": 3, "primary_group": "Macronutrient", "secondary_group": "Protein", "tertiary_group": "Amino Acid", "quaternary_group": "Essential", "sort_order": 101 },
    { "nutrient_name": "Isoleucine", "nutrient_symbol": "ILE", "unit": "g", "nutrient_decimals": 3, "primary_group": "Macronutrient", "secondary_group": "Protein", "tertiary_group": "Amino Acid", "quaternary_group": "Essential", "sort_order": 102 },
    { "nutrient_name": "Leucine", "nutrient_symbol": "LEU", "unit": "g", "nutrient_decimals": 3, "primary_group": "Macronutrient", "secondary_group": "Protein", "tertiary_group": "Amino Acid", "quaternary_group": "Essential", "sort_order": 103 },
    { "nutrient_name": "Lysine", "nutrient_symbol": "LYS", "unit": "g", "nutrient_decimals": 3, "primary_group": "Macronutrient", "secondary_group": "Protein", "tertiary_group": "Amino Acid", "quaternary_group": "Essential", "sort_order": 104 },
    { "nutrient_name": "Methionine", "nutrient_symbol": "MET", "unit": "g", "nutrient_decimals": 3, "primary_group": "Macronutrient", "secondary_group": "Protein", "tertiary_group": "Amino Acid", "quaternary_group": "Essential", "sort_order": 105 },
    { "nutrient_name": "Phenylalanine", "nutrient_symbol": "PHE", "unit": "g", "nutrient_decimals": 3, "primary_group": "Macronutrient", "secondary_group": "Protein", "tertiary_group": "Amino Acid", "quaternary_group": "Essential", "sort_order": 106 },
    { "nutrient_name": "Threonine", "nutrient_symbol": "THR", "unit": "g", "nutrient_decimals": 3, "primary_group": "Macronutrient", "secondary_group": "Protein", "tertiary_group": "Amino Acid", "quaternary_group": "Essential", "sort_order": 107 },
    { "nutrient_name": "Tryptophan", "nutrient_symbol": "TRP", "unit": "g", "nutrient_decimals": 3, "primary_group": "Macronutrient", "secondary_group": "Protein", "tertiary_group": "Amino Acid", "quaternary_group": "Essential", "sort_order": 108 },
    { "nutrient_name": "Valine", "nutrient_symbol": "VAL", "unit": "g", "nutrient_decimals": 3, "primary_group": "Macronutrient", "secondary_group": "Protein", "tertiary_group": "Amino Acid", "quaternary_group": "Essential", "sort_order": 109 },
    { "nutrient_name": "Alanine", "nutrient_symbol": "ALA", "unit": "g", "nutrient_decimals": 3, "primary_group": "Macronutrient", "secondary_group": "Protein", "tertiary_group": "Amino Acid", "quaternary_group": "Non-essential", "sort_order": 110 },
    { "nutrient_name": "Asparagine", "nutrient_symbol": "ASN", "unit": "g", "nutrient_decimals": 3, "primary_group": "Macronutrient", "secondary_group": "Protein", "tertiary_group": "Amino Acid", "quaternary_group": "Non-essential", "sort_order": 111 },
    { "nutrient_name": "Aspartic acid", "nutrient_symbol": "ASP", "unit": "g", "nutrient_decimals": 3, "primary_group": "Macronutrient", "secondary_group": "Protein", "tertiary_group": "Amino Acid", "quaternary_group": "Non-essential", "sort_order": 112 },
    { "nutrient_name": "Glutamic acid", "nutrient_symbol": "GLU", "unit": "g", "nutrient_decimals": 3, "primary_group": "Macronutrient", "secondary_group": "Protein", "tertiary_group": "Amino Acid", "quaternary_group": "Non-essential", "sort_order": 113 },
    { "nutrient_name": "Serine", "nutrient_symbol": "SER", "unit": "g", "nutrient_decimals": 3, "primary_group": "Macronutrient", "secondary_group": "Protein", "tertiary_group": "Amino Acid", "quaternary_group": "Non-essential", "sort_order": 114 },
    { "nutrient_name": "Arginine", "nutrient_symbol": "ARG", "unit": "g", "nutrient_decimals": 3, "primary_group": "Macronutrient", "secondary_group": "Protein", "tertiary_group": "Amino Acid", "quaternary_group": "Conditional", "sort_order": 115 },
    { "nutrient_name": "Cysteine", "nutrient_symbol": "CYS", "unit": "g", "nutrient_decimals": 3, "primary_group": "Macronutrient", "secondary_group": "Protein", "tertiary_group": "Amino Acid", "quaternary_group": "Conditional", "sort_order": 116 }, # Updated sort order
    { "nutrient_name": "Glutamine", "nutrient_symbol": "GLN", "unit": "g", "nutrient_decimals": 3, "primary_group": "Macronutrient", "secondary_group": "Protein", "tertiary_group": "Amino Acid", "quaternary_group": "Conditional", "sort_order": 117 },
    { "nutrient_name": "Glycine", "nutrient_symbol": "GLY", "unit": "g", "nutrient_decimals": 3, "primary_group": "Macronutrient", "secondary_group": "Protein", "tertiary_group": "Amino Acid", "quaternary_group": "Conditional", "sort_order": 118 },
    { "nutrient_name": "Proline", "nutrient_symbol": "PRO", "unit": "g", "nutrient_decimals": 3, "primary_group": "Macronutrient", "secondary_group": "Protein", "tertiary_group": "Amino Acid", "quaternary_group": "Conditional", "sort_order": 119 },
    { "nutrient_name": "Tyrosine", "nutrient_symbol": "TYR", "unit": "g", "nutrient_decimals": 3, "primary_group": "Macronutrient", "secondary_group": "Protein", "tertiary_group": "Amino Acid", "quaternary_group": "Conditional", "sort_order": 120 }, # Updated sort order
    # ** Fats **
    {
        "nutrient_name": "Fat, total", "nutrient_symbol": "FAT", "unit": "g", "nutrient_decimals": 1,
        "primary_group": "Macronutrient", "secondary_group": "Fat", "tertiary_group": None, "quaternary_group": None, "sort_order": 200,
    },
    {
        "nutrient_name": "Saturated Fatty Acids, total", "nutrient_symbol": "FASAT", "unit": "g", "nutrient_decimals": 2,
        "primary_group": "Macronutrient", "secondary_group": "Fat", "tertiary_group": "Saturated Fat", "quaternary_group": None, "sort_order": 201,
    },
    {
        "nutrient_name": "Monounsaturated Fatty Acids, total", "nutrient_symbol": "FAMS", "unit": "g", "nutrient_decimals": 2,
        "primary_group": "Macronutrient", "secondary_group": "Fat", "tertiary_group": "Monounsaturated Fat", "quaternary_group": None, "sort_order": 202,
    },
    {
        "nutrient_name": "Polyunsaturated Fatty Acids, total", "nutrient_symbol": "FAPU", "unit": "g", "nutrient_decimals": 2,
        "primary_group": "Macronutrient", "secondary_group": "Fat", "tertiary_group": "Polyunsaturated Fat", "quaternary_group": None, "sort_order": 203,
    },
    {
        "nutrient_name": "Omega-3 Fatty Acids, total", "nutrient_symbol": "FAPU3", "unit": "g", "nutrient_decimals": 3,
        "primary_group": "Macronutrient", "secondary_group": "Fat", "tertiary_group": "Polyunsaturated Fat", "quaternary_group": "Omega-3", "sort_order": 204,
    },
    {
        "nutrient_name": "ALA (Alpha-Linolenic Acid C18:3)", "nutrient_symbol": "F18D3", "unit": "g", "nutrient_decimals": 3,
        "primary_group": "Macronutrient", "secondary_group": "Fat", "tertiary_group": "Polyunsaturated Fat", "quaternary_group": "Omega-3", "sort_order": 205,
    },
    {
        "nutrient_name": "EPA (Eicosapentaenoic Acid C20:5)", "nutrient_symbol": "F20D5", "unit": "g", "nutrient_decimals": 3,
        "primary_group": "Macronutrient", "secondary_group": "Fat", "tertiary_group": "Polyunsaturated Fat", "quaternary_group": "Omega-3", "sort_order": 206,
    },
    {
        "nutrient_name": "DHA (Docosahexaenoic Acid C22:6)", "nutrient_symbol": "F22D6", "unit": "g", "nutrient_decimals": 3,
        "primary_group": "Macronutrient", "secondary_group": "Fat", "tertiary_group": "Polyunsaturated Fat", "quaternary_group": "Omega-3", "sort_order": 207,
    },
    {
        "nutrient_name": "Omega-6 Fatty Acids, total", "nutrient_symbol": "FAPU6", "unit": "g", "nutrient_decimals": 3,
        "primary_group": "Macronutrient", "secondary_group": "Fat", "tertiary_group": "Polyunsaturated Fat", "quaternary_group": "Omega-6", "sort_order": 208,
    },
    {
        "nutrient_name": "Linoleic Acid (C18:2)", "nutrient_symbol": "F18D2", "unit": "g", "nutrient_decimals": 3,
        "primary_group": "Macronutrient", "secondary_group": "Fat", "tertiary_group": "Polyunsaturated Fat", "quaternary_group": "Omega-6", "sort_order": 209,
    },
    {
        "nutrient_name": "Trans Fatty Acids, total", "nutrient_symbol": "FATRN", "unit": "g", "nutrient_decimals": 2,
        "primary_group": "Macronutrient", "secondary_group": "Fat", "tertiary_group": "Trans Fat", "quaternary_group": None, "sort_order": 215,
    },
    {
        "nutrient_name": "Cholesterol", "nutrient_symbol": "CHOLE", "unit": "mg", "nutrient_decimals": 0,
        "primary_group": "Macronutrient", "secondary_group": "Sterol", "tertiary_group": "Animal Sterol", "quaternary_group": None, "sort_order": 220,
    },
    {
        "nutrient_name": "Beta-Sitosterol", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 0,
        "primary_group": "Macronutrient", "secondary_group": "Sterol", "tertiary_group": "Plant Sterol", "quaternary_group": None, "sort_order": 221,
    },
    {
        "nutrient_name": "Campesterol", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 0,
        "primary_group": "Macronutrient", "secondary_group": "Sterol", "tertiary_group": "Plant Sterol", "quaternary_group": None, "sort_order": 222,
    },
    {
        "nutrient_name": "Stigmasterol", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 0,
        "primary_group": "Macronutrient", "secondary_group": "Sterol", "tertiary_group": "Plant Sterol", "quaternary_group": None, "sort_order": 223,
    },
    {
        "nutrient_name": "Ergosterol", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 0,
        "primary_group": "Macronutrient", "secondary_group": "Sterol", "tertiary_group": "Fungal Sterol", "quaternary_group": None, "sort_order": 224,
    },
    # --- Micronutrients ---
    # ** Vitamins **
    {
        "nutrient_name": "Vitamin A", "nutrient_symbol": "VITA", "unit": "µg", "nutrient_decimals": 0,
        "primary_group": "Micronutrient", "secondary_group": "Vitamin", "tertiary_group": "Fat-Soluble", "quaternary_group": "A", "sort_order": 300,
    },
    {
        "nutrient_name": "Vitamin D (D2 + D3)", "nutrient_symbol": "VITD", "unit": "µg", "nutrient_decimals": 1,
        "primary_group": "Micronutrient", "secondary_group": "Vitamin", "tertiary_group": "Fat-Soluble", "quaternary_group": "D", "sort_order": 301,
    },
    {
        "nutrient_name": "Vitamin E (alpha-tocopherol)", "nutrient_symbol": "VITE", "unit": "mg", "nutrient_decimals": 1,
        "primary_group": "Micronutrient", "secondary_group": "Vitamin", "tertiary_group": "Fat-Soluble", "quaternary_group": "E", "sort_order": 302,
    },
    {
        "nutrient_name": "Vitamin K (phylloquinone)", "nutrient_symbol": "VITK1", "unit": "µg", "nutrient_decimals": 0,
        "primary_group": "Micronutrient", "secondary_group": "Vitamin", "tertiary_group": "Fat-Soluble", "quaternary_group": "K", "sort_order": 303,
    },
    {
        "nutrient_name": "Vitamin C (Ascorbic acid)", "nutrient_symbol": "VITC", "unit": "mg", "nutrient_decimals": 1,
        "primary_group": "Micronutrient", "secondary_group": "Vitamin", "tertiary_group": "Water-Soluble", "quaternary_group": "C", "sort_order": 310,
    },
    {
        "nutrient_name": "Thiamine (Vitamin B1)", "nutrient_symbol": "THIA", "unit": "mg", "nutrient_decimals": 2,
        "primary_group": "Micronutrient", "secondary_group": "Vitamin", "tertiary_group": "Water-Soluble", "quaternary_group": "B1 (Thiamine)", "sort_order": 311,
    },
    {
        "nutrient_name": "Riboflavin (Vitamin B2)", "nutrient_symbol": "RIBF", "unit": "mg", "nutrient_decimals": 2,
        "primary_group": "Micronutrient", "secondary_group": "Vitamin", "tertiary_group": "Water-Soluble", "quaternary_group": "B2 (Riboflavin)", "sort_order": 312,
    },
    {
        "nutrient_name": "Niacin (Vitamin B3)", "nutrient_symbol": "NIA", "unit": "mg", "nutrient_decimals": 1,
        "primary_group": "Micronutrient", "secondary_group": "Vitamin", "tertiary_group": "Water-Soluble", "quaternary_group": "B3 (Niacin)", "sort_order": 313,
    },
    {
        "nutrient_name": "Pantothenic acid (Vitamin B5)", "nutrient_symbol": "PANTAC", "unit": "mg", "nutrient_decimals": 1,
        "primary_group": "Micronutrient", "secondary_group": "Vitamin", "tertiary_group": "Water-Soluble", "quaternary_group": "B5 (Pantothenic Acid)", "sort_order": 315,
    },
    {
        "nutrient_name": "Vitamin B6", "nutrient_symbol": "VITB6A", "unit": "mg", "nutrient_decimals": 2,
        "primary_group": "Micronutrient", "secondary_group": "Vitamin", "tertiary_group": "Water-Soluble", "quaternary_group": "B6 (Pyridoxine)", "sort_order": 316,
    },
    {
        "nutrient_name": "Biotin (Vitamin B7)", "nutrient_symbol": "BIOT", "unit": "µg", "nutrient_decimals": 0,
        "primary_group": "Micronutrient", "secondary_group": "Vitamin", "tertiary_group": "Water-Soluble", "quaternary_group": "B7 (Biotin)", "sort_order": 317,
    },
    {
        "nutrient_name": "Folate (Vitamin B9)", "nutrient_symbol": "FOL", "unit": "µg", "nutrient_decimals": 0,
        "primary_group": "Micronutrient", "secondary_group": "Vitamin", "tertiary_group": "Water-Soluble", "quaternary_group": "B9 (Folate)", "sort_order": 318,
    },
    {
        "nutrient_name": "Vitamin B12 (Cobalamin)", "nutrient_symbol": "VITB12", "unit": "µg", "nutrient_decimals": 1,
        "primary_group": "Micronutrient", "secondary_group": "Vitamin", "tertiary_group": "Water-Soluble", "quaternary_group": "B12 (Cobalamin)", "sort_order": 319,
    },
    {
        "nutrient_name": "Choline", "nutrient_symbol": "CHOLN", "unit": "mg", "nutrient_decimals": 0,
        "primary_group": "Micronutrient", "secondary_group": "Vitamin-like Compound", "tertiary_group": None, "quaternary_group": None, "sort_order": 330,
    },
    {
        "nutrient_name": "Carnitine", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 1,
        "primary_group": "Micronutrient", "secondary_group": "Vitamin-like Compound", "tertiary_group": None, "quaternary_group": None, "sort_order": 331,
    },
    {
        "nutrient_name": "Inositol", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 0,
        "primary_group": "Micronutrient", "secondary_group": "Vitamin-like Compound", "tertiary_group": None, "quaternary_group": None, "sort_order": 332,
    },
    # ** Minerals **
    { "nutrient_name": "Calcium", "nutrient_symbol": "CA", "unit": "mg", "nutrient_decimals": 0, "primary_group": "Micronutrient", "secondary_group": "Mineral", "tertiary_group": "Macromineral", "quaternary_group": None, "sort_order": 400 },
    { "nutrient_name": "Phosphorus", "nutrient_symbol": "P", "unit": "mg", "nutrient_decimals": 0, "primary_group": "Micronutrient", "secondary_group": "Mineral", "tertiary_group": "Macromineral", "quaternary_group": None, "sort_order": 401 },
    { "nutrient_name": "Magnesium", "nutrient_symbol": "MG", "unit": "mg", "nutrient_decimals": 0, "primary_group": "Micronutrient", "secondary_group": "Mineral", "tertiary_group": "Macromineral", "quaternary_group": None, "sort_order": 402 },
    { "nutrient_name": "Sodium", "nutrient_symbol": "NA", "unit": "mg", "nutrient_decimals": 0, "primary_group": "Micronutrient", "secondary_group": "Mineral", "tertiary_group": "Macromineral", "quaternary_group": None, "sort_order": 403 },
    { "nutrient_name": "Potassium", "nutrient_symbol": "K", "unit": "mg", "nutrient_decimals": 0, "primary_group": "Micronutrient", "secondary_group": "Mineral", "tertiary_group": "Macromineral", "quaternary_group": None, "sort_order": 404 },
    { "nutrient_name": "Chloride", "nutrient_symbol": "CL", "unit": "mg", "nutrient_decimals": 0, "primary_group": "Micronutrient", "secondary_group": "Mineral", "tertiary_group": "Macromineral", "quaternary_group": None, "sort_order": 405 },
    { "nutrient_name": "Sulfur", "nutrient_symbol": "S", "unit": "mg", "nutrient_decimals": 0, "primary_group": "Micronutrient", "secondary_group": "Mineral", "tertiary_group": "Macromineral", "quaternary_group": None, "sort_order": 406 },
    { "nutrient_name": "Iron", "nutrient_symbol": "FE", "unit": "mg", "nutrient_decimals": 1, "primary_group": "Micronutrient", "secondary_group": "Mineral", "tertiary_group": "Trace Mineral", "quaternary_group": None, "sort_order": 410 },
    { "nutrient_name": "Zinc", "nutrient_symbol": "ZN", "unit": "mg", "nutrient_decimals": 1, "primary_group": "Micronutrient", "secondary_group": "Mineral", "tertiary_group": "Trace Mineral", "quaternary_group": None, "sort_order": 411 },
    { "nutrient_name": "Copper", "nutrient_symbol": "CU", "unit": "mg", "nutrient_decimals": 2, "primary_group": "Micronutrient", "secondary_group": "Mineral", "tertiary_group": "Trace Mineral", "quaternary_group": None, "sort_order": 412 },
    { "nutrient_name": "Manganese", "nutrient_symbol": "MN", "unit": "mg", "nutrient_decimals": 2, "primary_group": "Micronutrient", "secondary_group": "Mineral", "tertiary_group": "Trace Mineral", "quaternary_group": None, "sort_order": 413 },
    { "nutrient_name": "Iodine", "nutrient_symbol": "ID", "unit": "µg", "nutrient_decimals": 0, "primary_group": "Micronutrient", "secondary_group": "Mineral", "tertiary_group": "Trace Mineral", "quaternary_group": None, "sort_order": 414 },
    { "nutrient_name": "Selenium", "nutrient_symbol": "SE", "unit": "µg", "nutrient_decimals": 0, "primary_group": "Micronutrient", "secondary_group": "Mineral", "tertiary_group": "Trace Mineral", "quaternary_group": None, "sort_order": 415 },
    { "nutrient_name": "Fluoride", "nutrient_symbol": "F", "unit": "mg", "nutrient_decimals": 2, "primary_group": "Micronutrient", "secondary_group": "Mineral", "tertiary_group": "Trace Mineral", "quaternary_group": None, "sort_order": 416 },
    { "nutrient_name": "Chromium", "nutrient_symbol": "CR", "unit": "µg", "nutrient_decimals": 0, "primary_group": "Micronutrient", "secondary_group": "Mineral", "tertiary_group": "Trace Mineral", "quaternary_group": None, "sort_order": 417 },
    { "nutrient_name": "Molybdenum", "nutrient_symbol": "MO", "unit": "µg", "nutrient_decimals": 0, "primary_group": "Micronutrient", "secondary_group": "Mineral", "tertiary_group": "Trace Mineral", "quaternary_group": None, "sort_order": 418 },
    { "nutrient_name": "Boron", "nutrient_symbol": "B", "unit": "µg", "nutrient_decimals": 1, "primary_group": "Micronutrient", "secondary_group": "Mineral", "tertiary_group": "Trace Mineral", "quaternary_group": None, "sort_order": 419 },
    { "nutrient_name": "Nickel", "nutrient_symbol": "NI", "unit": "µg", "nutrient_decimals": 1, "primary_group": "Micronutrient", "secondary_group": "Mineral", "tertiary_group": "Trace Mineral", "quaternary_group": None, "sort_order": 420 },
    { "nutrient_name": "Silicon", "nutrient_symbol": "SI", "unit": "mg", "nutrient_decimals": 2, "primary_group": "Micronutrient", "secondary_group": "Mineral", "tertiary_group": "Trace Mineral", "quaternary_group": None, "sort_order": 421 },
    { "nutrient_name": "Vanadium", "nutrient_symbol": "V", "unit": "µg", "nutrient_decimals": 1, "primary_group": "Micronutrient", "secondary_group": "Mineral", "tertiary_group": "Trace Mineral", "quaternary_group": None, "sort_order": 422 },
    # --- Bioactive Compounds ---
    # ** Carotenoids **
    { "nutrient_name": "Beta-Carotene", "nutrient_symbol": "CARTB", "unit": "µg", "nutrient_decimals": 0, "primary_group": "Bioactive Compound", "secondary_group": "Carotenoid", "tertiary_group": "Pro-Vitamin A", "quaternary_group": None, "sort_order": 500 },
    { "nutrient_name": "Alpha-Carotene", "nutrient_symbol": "CARTA", "unit": "µg", "nutrient_decimals": 0, "primary_group": "Bioactive Compound", "secondary_group": "Carotenoid", "tertiary_group": "Pro-Vitamin A", "quaternary_group": None, "sort_order": 501 },
    { "nutrient_name": "Beta-Cryptoxanthin", "nutrient_symbol": "CRYPX", "unit": "µg", "nutrient_decimals": 0, "primary_group": "Bioactive Compound", "secondary_group": "Carotenoid", "tertiary_group": "Pro-Vitamin A", "quaternary_group": None, "sort_order": 502 },
    { "nutrient_name": "Lycopene", "nutrient_symbol": "LYCPN", "unit": "µg", "nutrient_decimals": 0, "primary_group": "Bioactive Compound", "secondary_group": "Carotenoid", "tertiary_group": None, "quaternary_group": None, "sort_order": 503 },
    { "nutrient_name": "Lutein", "nutrient_symbol": "LUT", "unit": "µg", "nutrient_decimals": 0, "primary_group": "Bioactive Compound", "secondary_group": "Carotenoid", "tertiary_group": "Xanthophyll", "quaternary_group": None, "sort_order": 504 },
    { "nutrient_name": "Zeaxanthin", "nutrient_symbol": "ZEA", "unit": "µg", "nutrient_decimals": 0, "primary_group": "Bioactive Compound", "secondary_group": "Carotenoid", "tertiary_group": "Xanthophyll", "quaternary_group": None, "sort_order": 505 },
    { "nutrient_name": "Lutein + Zeaxanthin", "nutrient_symbol": "LUT+ZEA", "unit": "µg", "nutrient_decimals": 0, "primary_group": "Bioactive Compound", "secondary_group": "Carotenoid", "tertiary_group": "Xanthophyll", "quaternary_group": None, "sort_order": 506 },
    # ** Polyphenols / Flavonoids **
    { "nutrient_name": "Quercetin", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Polyphenol", "tertiary_group": "Flavonoid", "quaternary_group": "Flavonol", "sort_order": 510 },
    { "nutrient_name": "Kaempferol", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Polyphenol", "tertiary_group": "Flavonoid", "quaternary_group": "Flavonol", "sort_order": 511 },
    { "nutrient_name": "Myricetin", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Polyphenol", "tertiary_group": "Flavonoid", "quaternary_group": "Flavonol", "sort_order": 512 },
    { "nutrient_name": "Isorhamnetin", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Polyphenol", "tertiary_group": "Flavonoid", "quaternary_group": "Flavonol", "sort_order": 513 },
    { "nutrient_name": "Fisetin", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Polyphenol", "tertiary_group": "Flavonoid", "quaternary_group": "Flavonol", "sort_order": 514 },
    { "nutrient_name": "Luteolin", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Polyphenol", "tertiary_group": "Flavonoid", "quaternary_group": "Flavone", "sort_order": 520 },
    { "nutrient_name": "Apigenin", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Polyphenol", "tertiary_group": "Flavonoid", "quaternary_group": "Flavone", "sort_order": 521 },
    { "nutrient_name": "Catechin", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Polyphenol", "tertiary_group": "Flavonoid", "quaternary_group": "Flavan-3-ol", "sort_order": 530 },
    { "nutrient_name": "Epicatechin", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Polyphenol", "tertiary_group": "Flavonoid", "quaternary_group": "Flavan-3-ol", "sort_order": 531 },
    { "nutrient_name": "Gallocatechin", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Polyphenol", "tertiary_group": "Flavonoid", "quaternary_group": "Flavan-3-ol", "sort_order": 532 },
    { "nutrient_name": "Epigallocatechin", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Polyphenol", "tertiary_group": "Flavonoid", "quaternary_group": "Flavan-3-ol", "sort_order": 533 },
    { "nutrient_name": "Catechin Gallate", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Polyphenol", "tertiary_group": "Flavonoid", "quaternary_group": "Flavan-3-ol", "sort_order": 534 },
    { "nutrient_name": "Epicatechin Gallate (ECG)", "nutrient_symbol": "ECG", "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Polyphenol", "tertiary_group": "Flavonoid", "quaternary_group": "Flavan-3-ol", "sort_order": 535 },
    { "nutrient_name": "Epigallocatechin Gallate (EGCG)", "nutrient_symbol": "EGCG", "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Polyphenol", "tertiary_group": "Flavonoid", "quaternary_group": "Flavan-3-ol", "sort_order": 536 },
    { "nutrient_name": "Hesperidin", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Polyphenol", "tertiary_group": "Flavonoid", "quaternary_group": "Flavanone", "sort_order": 540 },
    { "nutrient_name": "Naringenin", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Polyphenol", "tertiary_group": "Flavonoid", "quaternary_group": "Flavanone", "sort_order": 541 },
    { "nutrient_name": "Eriodictyol", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Polyphenol", "tertiary_group": "Flavonoid", "quaternary_group": "Flavanone", "sort_order": 542 },
    { "nutrient_name": "Cyanidin", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Polyphenol", "tertiary_group": "Flavonoid", "quaternary_group": "Anthocyanidin", "sort_order": 550 },
    { "nutrient_name": "Delphinidin", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Polyphenol", "tertiary_group": "Flavonoid", "quaternary_group": "Anthocyanidin", "sort_order": 551 },
    { "nutrient_name": "Pelargonidin", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Polyphenol", "tertiary_group": "Flavonoid", "quaternary_group": "Anthocyanidin", "sort_order": 552 },
    { "nutrient_name": "Peonidin", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Polyphenol", "tertiary_group": "Flavonoid", "quaternary_group": "Anthocyanidin", "sort_order": 553 },
    { "nutrient_name": "Petunidin", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Polyphenol", "tertiary_group": "Flavonoid", "quaternary_group": "Anthocyanidin", "sort_order": 554 },
    { "nutrient_name": "Malvidin", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Polyphenol", "tertiary_group": "Flavonoid", "quaternary_group": "Anthocyanidin", "sort_order": 555 },
    { "nutrient_name": "Genistein", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Polyphenol", "tertiary_group": "Flavonoid", "quaternary_group": "Isoflavone", "sort_order": 560 },
    { "nutrient_name": "Daidzein", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Polyphenol", "tertiary_group": "Flavonoid", "quaternary_group": "Isoflavone", "sort_order": 561 },
    { "nutrient_name": "Glycitein", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Polyphenol", "tertiary_group": "Flavonoid", "quaternary_group": "Isoflavone", "sort_order": 562 },
    { "nutrient_name": "Formononetin", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Polyphenol", "tertiary_group": "Flavonoid", "quaternary_group": "Isoflavone", "sort_order": 563 },
    { "nutrient_name": "Biochanin A", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Polyphenol", "tertiary_group": "Flavonoid", "quaternary_group": "Isoflavone", "sort_order": 564 },
    # ** Glucosinolates **
    { "nutrient_name": "Glucoraphanin", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Glucosinolate", "tertiary_group": None, "quaternary_group": None, "sort_order": 600 },
    { "nutrient_name": "Glucobrassicin", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Glucosinolate", "tertiary_group": None, "quaternary_group": None, "sort_order": 601 },
    { "nutrient_name": "Sinigrin", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Glucosinolate", "tertiary_group": None, "quaternary_group": None, "sort_order": 602 },
    { "nutrient_name": "Gluconasturtiin", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Glucosinolate", "tertiary_group": None, "quaternary_group": None, "sort_order": 603 },
    { "nutrient_name": "Glucoiberin", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Glucosinolate", "tertiary_group": None, "quaternary_group": None, "sort_order": 604 },
    { "nutrient_name": "Gluconapin", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Glucosinolate", "tertiary_group": None, "quaternary_group": None, "sort_order": 605 },
    { "nutrient_name": "Progoitrin", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Glucosinolate", "tertiary_group": None, "quaternary_group": None, "sort_order": 606 },
    # ** Organosulfur Compounds **
    { "nutrient_name": "Alliin", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Organosulfur Compound", "tertiary_group": "Allium Compound", "quaternary_group": None, "sort_order": 620 },
    { "nutrient_name": "Allicin", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Organosulfur Compound", "tertiary_group": "Allium Compound", "quaternary_group": None, "sort_order": 621 },
    { "nutrient_name": "Diallyl Sulfide (DAS)", "nutrient_symbol": "DAS", "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Organosulfur Compound", "tertiary_group": "Allium Compound", "quaternary_group": None, "sort_order": 622 },
    { "nutrient_name": "Diallyl Disulfide (DADS)", "nutrient_symbol": "DADS", "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Organosulfur Compound", "tertiary_group": "Allium Compound", "quaternary_group": None, "sort_order": 623 },
    { "nutrient_name": "Diallyl Trisulfide (DATS)", "nutrient_symbol": "DATS", "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Organosulfur Compound", "tertiary_group": "Allium Compound", "quaternary_group": None, "sort_order": 624 },
    { "nutrient_name": "S-Allyl Cysteine (SAC)", "nutrient_symbol": "SAC", "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Organosulfur Compound", "tertiary_group": "Allium Compound", "quaternary_group": None, "sort_order": 625 },
    # ** Phytoestrogens ** (Lignans, Coumestans - Isoflavones already covered)
    { "nutrient_name": "Secoisolariciresinol", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Phytoestrogen", "tertiary_group": "Lignan", "quaternary_group": None, "sort_order": 640 },
    { "nutrient_name": "Matairesinol", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Phytoestrogen", "tertiary_group": "Lignan", "quaternary_group": None, "sort_order": 641 },
    { "nutrient_name": "Lariciresinol", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Phytoestrogen", "tertiary_group": "Lignan", "quaternary_group": None, "sort_order": 642 },
    { "nutrient_name": "Pinoresinol", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Phytoestrogen", "tertiary_group": "Lignan", "quaternary_group": None, "sort_order": 643 },
    { "nutrient_name": "Coumestrol", "nutrient_symbol": None, "unit": "mg", "nutrient_decimals": 2, "primary_group": "Bioactive Compound", "secondary_group": "Phytoestrogen", "tertiary_group": "Coumestan", "quaternary_group": None, "sort_order": 650 },
]