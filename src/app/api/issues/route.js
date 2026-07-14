import connectMongo from "@/src/lib/mongo";
import Issue from "@/src/models/Issue";
import { saveUploadedImages } from "@/src/lib/part";
import { badRequest, notFound } from "@/src/lib/api";

export async function GET() {
  await connectMongo();

  try {
    const issues = await Issue.find({}).sort({ createdAt: -1 });
    return new Response(JSON.stringify(issues), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(request) {
  await connectMongo();

  try {
    const formData = await request.formData();
    const subject = formData.get("subject")?.toString();
    const user = formData.get("user")?.toString();
    const phone = formData.get("phone")?.toString();
    const location = formData.get("location")?.toString();
    const description = formData.get("description")?.toString();
    const assignedTo = formData.get("assignedTo")?.toString();
    const repairPhone = formData.get("repairPhone")?.toString();
    const imageFiles = formData.getAll("images").filter(
      (file) => file && typeof file.size === "number" && file.size > 0,
    );
    console.log('[api/issues] received imageFiles count:', imageFiles.length, imageFiles.map(f => f && (f.name || f.type || typeof f)));

    const count = await Issue.countDocuments();
    const issueId = `ISS-${202 + count}`;
    const imagePaths = await saveUploadedImages(imageFiles, `Home/support/${issueId}`);
    console.log('[api/issues] saveUploadedImages returned:', imagePaths.length, imagePaths);
    console.log("the imagePaths from the support is the ", imagePaths);

    const newIssue = new Issue({
      id: issueId,
      subject,
      user,
      phone,
      location,
      description,
      assignedTo: assignedTo || "",
      repairPhone: repairPhone || "",
      images: imagePaths,
      status: "open",
      at: "Just now",
    });

    const savedIssue = await newIssue.save();
    console.log('[api/issues] savedIssue:', savedIssue.id, (savedIssue.images || []).length, savedIssue.images);
    return new Response(JSON.stringify(savedIssue), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function PATCH(request) {
  await connectMongo();

  try {
    const body = await request.json();
    const { id, status, assignedTo, repairPhone } = body;
    if (!id) {
      return badRequest("Issue id is required.");
    }

    const updates = {};
    if (status) {
      const validStatuses = ["open", "pending", "in_working", "seen", "resolved"];
      if (!validStatuses.includes(status)) {
        return badRequest("Invalid status value.");
      }
      updates.status = status;
    }
    if (assignedTo !== undefined) {
      updates.assignedTo = assignedTo;
    }
    if (repairPhone !== undefined) {
      updates.repairPhone = repairPhone;
    }
    if (Object.keys(updates).length === 0) {
      return badRequest("No update values provided.");
    }

    const updatedIssue = await Issue.findOneAndUpdate(
      { id },
      updates,
      { new: true },
    );

    if (!updatedIssue) {
      return notFound(`Issue not found with id ${id}`);
    }

    return new Response(JSON.stringify(updatedIssue), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
