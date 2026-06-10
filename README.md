# Zero-Shot & Few-Shot Data Extraction Using LLMs

## Project Overview

This project demonstrates how Large Language Models (LLMs) can be used to extract structured information from messy, unstructured text and convert it into a valid JSON format using Prompt Engineering techniques.

The project focuses on two popular prompting approaches:

* Zero-Shot Prompting
* Few-Shot Prompting

It also highlights the importance of delimiter usage, deterministic output generation, JSON validation, and temperature control.

---

## Problem Statement

Organizations often receive data in unstructured formats such as emails, invoices, customer messages, forms, and notes. Extracting useful information manually is time-consuming and error-prone.

The goal of this project is to use an LLM to automatically identify and extract relevant fields from unstructured text and return them in a clean JSON format.

---

## Objectives

* Extract structured information from unstructured text.
* Compare Zero-Shot and Few-Shot prompting techniques.
* Generate deterministic outputs using temperature control.
* Ensure valid JSON formatting.
* Demonstrate effective Prompt Engineering practices.

---

## Technologies Used

* Python
* OpenAI API (or any compatible LLM)
* JSON
* Prompt Engineering
* Zero-Shot Learning
* Few-Shot Learning

---

## Project Structure

```text
ZeroShot_FewShot_DataExtraction/
│
├── data/
│   ├── sample_input_1.txt
│   ├── sample_input_2.txt
│   └── sample_input_3.txt
│
├── prompts/
│   ├── zero_shot_prompt.txt
│   └── few_shot_prompt.txt
│
├── examples/
│   ├── example_1.json
│   ├── example_2.json
│   └── example_3.json
│
├── outputs/
│   ├── zero_shot_output.json
│   └── few_shot_output.json
│
├── src/
│   ├── main.py
│   ├── prompt_builder.py
│   ├── data_extractor.py
│   └── json_validator.py
│
├── report/
│   └── Project_Report.docx
│
├── presentation/
│   └── Project_Presentation.pptx
│
└── README.md
```

---

## Methodology

### Step 1: Data Collection

Collect messy and unstructured text samples containing customer information.

### Step 2: Prompt Design

Create prompts that clearly instruct the model to extract information and return JSON output.

### Step 3: Zero-Shot Prompting

Provide only instructions without examples.

### Step 4: Few-Shot Prompting

Provide 2–3 Input/Output examples before the actual input data to improve extraction accuracy.

### Step 5: JSON Validation

Validate the generated response to ensure it follows the required schema.

### Step 6: Result Comparison

Compare the outputs of Zero-Shot and Few-Shot prompting techniques.

---

## Delimiter Usage

The project uses strict delimiters to separate instructions from raw data.

Example:

```text
"""
Customer Name: Rahul Sharma
Email: rahul@gmail.com
Phone: 9876543210
"""
```

This helps the model distinguish instructions from input data.

---

## Output Schema

```json
{
  "customer_name": "",
  "email": "",
  "phone": "",
  "product": "",
  "price": null,
  "date": ""
}
```

Missing fields should be returned as null.

---

## Temperature Control

The model temperature is set to:

```python
temperature = 0
```

Benefits:

* Deterministic outputs
* Consistent JSON formatting
* Reduced randomness
* Improved reliability

---

## Sample Input

```text
Customer Name: Rahul Sharma
Email: rahul@gmail.com
Phone: 9876543210

Purchased: Dell Laptop
Price: Rs 55000
Date: 12/05/2026
```

---

## Sample Output

```json
{
  "customer_name": "Rahul Sharma",
  "email": "rahul@gmail.com",
  "phone": "9876543210",
  "product": "Dell Laptop",
  "price": 55000,
  "date": "12/05/2026"
}
```

---

## Results

### Zero-Shot Prompting

* Simple implementation
* Works well for straightforward inputs
* May miss fields when formats vary

### Few-Shot Prompting

* Higher extraction accuracy
* Better handling of variations
* More consistent JSON outputs

---

## Advantages

* Automated information extraction
* Reduced manual effort
* Easy integration with applications
* Structured and machine-readable outputs
* Improved accuracy using Few-Shot learning

---

## Limitations

* Dependent on prompt quality
* Complex documents may require advanced prompting
* Incorrect examples can reduce performance

---

## Future Scope

* Support multiple document formats
* Real-time extraction APIs
* Invoice and resume parsing
* Integration with databases
* Fine-tuned extraction models

---

## Conclusion

This project successfully demonstrates the use of Zero-Shot and Few-Shot Prompting for data extraction tasks. By leveraging Prompt Engineering techniques such as delimiter usage, example-based learning, deterministic generation, and JSON validation, the system can reliably convert unstructured text into structured JSON data suitable for downstream applications.

---

## Author

Internship Project

**Title:** Zero-Shot & Few-Shot Data Extraction Using LLMs

**Domain:** Prompt Engineering & Generative AI
